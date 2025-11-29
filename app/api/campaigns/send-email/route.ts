import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { CampaignEmail } from '@/lib/email-templates/campaign-email'
import { render } from '@react-email/render'

const resend = new Resend(process.env.RESEND_API_KEY)

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      campaignId,
      recipientListId,
      subject,
      headline,
      bodyText,
      ctaLabel,
      ctaUrl,
      imageUrl,
      accentColor,
      fromName,
      fromEmail,
      testMode = false,
      testEmail,
    } = body

    // Validate required fields
    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    if (!subject || !headline || !bodyText || !ctaLabel || !ctaUrl) {
      return NextResponse.json(
        { ok: false, error: 'Email content fields are required' },
        { status: 400 }
      )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, organization_id, organizations(name)')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { ok: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const organizationName = (campaign.organizations as any)?.name || 'Your Organization'

    // In test mode, send to test email only
    if (testMode && testEmail) {
      const emailHtml = render(
        CampaignEmail({
          campaignName: campaign.name,
          subject,
          headline,
          body: bodyText,
          ctaLabel,
          ctaUrl,
          imageUrl,
          accentColor,
          organizationName,
          recipientName: 'Test User',
        })
      )

      const result = await resend.emails.send({
        from: fromEmail || 'campaigns@awarehub.app',
        to: testEmail,
        subject: `[TEST] ${subject}`,
        html: emailHtml,
        headers: {
          'X-Campaign-ID': campaignId,
          'X-Test-Mode': 'true',
        },
      })

      if (result.error) {
        return NextResponse.json(
          { ok: false, error: result.error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        message: 'Test email sent successfully',
        sentCount: 1,
        emailId: result.data?.id,
      })
    }

    // Production mode - send to recipient list
    if (!recipientListId) {
      return NextResponse.json(
        { ok: false, error: 'Recipient list ID is required for campaign sending' },
        { status: 400 }
      )
    }

    // Fetch recipients from the list
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('recipient_contact_memberships')
      .select('contact:recipient_contacts(id, email, full_name)')
      .eq('list_id', recipientListId)
      .limit(1000) // Limit to 1000 recipients per batch

    if (membershipsError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch recipients' },
        { status: 500 }
      )
    }

    const recipients = memberships
      .map((m: any) => m.contact)
      .filter((c: any) => c && c.email)

    if (recipients.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No recipients found in the selected list' },
        { status: 400 }
      )
    }

    // Get or create email channel
    const { data: emailChannel, error: channelError } = await supabaseAdmin
      .from('channels')
      .select('id')
      .eq('organization_id', campaign.organization_id)
      .eq('type', 'email')
      .eq('is_enabled', true)
      .single()

    let channelId = emailChannel?.id

    if (!emailChannel && !channelError) {
      // Create email channel if it doesn't exist
      const { data: newChannel } = await supabaseAdmin
        .from('channels')
        .insert({
          organization_id: campaign.organization_id,
          type: 'email',
          name: 'Email',
          is_enabled: true,
        })
        .select('id')
        .single()

      channelId = newChannel?.id
    }

    // Create or update campaign channel record
    if (channelId) {
      await supabaseAdmin
        .from('campaign_channels')
        .upsert({
          organization_id: campaign.organization_id,
          campaign_id: campaignId,
          channel_id: channelId,
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_payload: {
            subject,
            headline,
            body: bodyText,
            ctaLabel,
            ctaUrl,
            imageUrl,
            accentColor,
          },
        }, {
          onConflict: 'campaign_id,channel_id'
        })
    }

    // Send emails in batches
    const batchSize = 100
    const batches = []
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize))
    }

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    for (const batch of batches) {
      const emailPromises = batch.map(async (recipient: any) => {
        try {
          const emailHtml = render(
            CampaignEmail({
              campaignName: campaign.name,
              subject,
              headline,
              body: bodyText,
              ctaLabel,
              ctaUrl,
              imageUrl,
              accentColor,
              organizationName,
              recipientName: recipient.full_name || recipient.email.split('@')[0],
            })
          )

          const result = await resend.emails.send({
            from: fromEmail || 'campaigns@awarehub.app',
            to: recipient.email,
            subject,
            html: emailHtml,
            headers: {
              'X-Campaign-ID': campaignId,
              'X-Recipient-ID': recipient.id,
            },
          })

          if (result.error) {
            failureCount++
            errors.push(`${recipient.email}: ${result.error.message}`)
          } else {
            successCount++

            // Track engagement event
            await supabaseAdmin.from('engagement_events').insert({
              organization_id: campaign.organization_id,
              campaign_id: campaignId,
              event_type: 'view',
              event_value: 'email_sent',
              metadata: {
                recipient_email: recipient.email,
                email_id: result.data?.id,
              },
            })
          }
        } catch (error: any) {
          failureCount++
          errors.push(`${recipient.email}: ${error.message}`)
        }
      })

      await Promise.all(emailPromises)
    }

    // Update campaign status to active if it was draft
    const campaignStatus = (campaign as any)?.status
    if (campaignStatus === 'draft') {
      await supabaseAdmin
        .from('campaigns')
        .update({
          status: 'active',
          start_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
    }

    return NextResponse.json({
      ok: true,
      message: `Campaign sent successfully to ${successCount} recipients`,
      sentCount: successCount,
      failureCount,
      totalRecipients: recipients.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error: any) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
