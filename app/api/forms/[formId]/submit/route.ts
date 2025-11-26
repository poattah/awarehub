import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params
    const body = await request.json()
    const { data: formData, ip, userAgent, referrer } = body

    // Validate required email field
    if (!formData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get form configuration
    const { data: form, error: formError } = await supabase
      .from('signup_forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if form is active
    if (form.status !== 'active') {
      return NextResponse.json(
        { error: 'This form is no longer accepting submissions' },
        { status: 400 }
      )
    }

    // Validate required fields based on form configuration
    const fields = form.fields as Record<string, any>
    for (const [key, config] of Object.entries(fields)) {
      if (config.enabled && config.required && !formData[key]) {
        return NextResponse.json(
          { error: `${config.label} is required` },
          { status: 400 }
        )
      }
    }

    // Check for duplicates if not allowed
    const settings = form.settings as Record<string, any>
    if (!settings.allow_duplicates) {
      const { data: existingSubmission } = await supabase
        .from('signup_form_submissions')
        .select('id')
        .eq('form_id', formId)
        .eq('data->>email', formData.email)
        .single()

      if (existingSubmission) {
        return NextResponse.json(
          { error: 'This email has already been submitted' },
          { status: 400 }
        )
      }
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('signup_form_submissions')
      .insert({
        form_id: formId,
        data: formData,
        ip_address: ip,
        user_agent: userAgent,
        referrer: referrer,
        status: settings.double_opt_in ? 'pending' : 'confirmed',
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json(
        { error: 'Failed to submit form' },
        { status: 500 }
      )
    }

    // If not using double opt-in, create contact immediately
    if (!settings.double_opt_in && form.target_list_id) {
      // Prepare contact data
      const fullName = formData.first_name && formData.last_name
        ? `${formData.first_name} ${formData.last_name}`
        : formData.email

      const metadata: Record<string, string> = {}
      if (formData.first_name) metadata.first_name = formData.first_name
      if (formData.last_name) metadata.last_name = formData.last_name

      // Add any additional fields to metadata
      Object.keys(formData).forEach((key) => {
        if (!['email', 'first_name', 'last_name', 'phone', 'title', 'location'].includes(key)) {
          metadata[key] = formData[key]
        }
      })

      // Create or update contact
      const { data: contact, error: contactError } = await supabase
        .from('recipient_contacts')
        .upsert(
          {
            email: formData.email,
            full_name: fullName,
            phone: formData.phone || null,
            title: formData.title || null,
            location: formData.location || null,
            tags: [],
            channels: ['Email'],
            metadata,
          },
          {
            onConflict: 'email',
          }
        )
        .select()
        .single()

      if (!contactError && contact) {
        // Add to target list
        await supabase
          .from('recipient_contact_memberships')
          .upsert(
            {
              list_id: form.target_list_id,
              contact_id: contact.id,
            },
            {
              onConflict: 'list_id,contact_id',
            }
          )

        // Update submission with contact_id
        await supabase
          .from('signup_form_submissions')
          .update({ contact_id: contact.id, status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', submission.id)
      }
    }

    // Return success response
    const successConfig = form.success_config as Record<string, any>
    return NextResponse.json({
      success: true,
      message: successConfig.message,
      redirect_url: successConfig.redirect_url,
      requires_confirmation: settings.double_opt_in,
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
