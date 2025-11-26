import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = createServerClient()

  // Get authorization token from headers
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { ok: false, error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  // Get user from token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized - invalid or expired token' },
      { status: 401 }
    )
  }

  // Get user's profile to find their organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return NextResponse.json(
      { ok: false, error: 'User profile not found or missing organization' },
      { status: 403 }
    )
  }

  // Return available integrations with their status
  // In a real app, this would check the database for configured integrations
  const integrations = [
    {
      type: 'slack',
      name: 'Slack',
      description: 'Send messages to Slack channels',
      icon: 'slack',
      isConnected: false,
      configuration: {}
    },
    {
      type: 'microsoft_teams',
      name: 'Microsoft Teams',
      description: 'Send messages to Teams channels',
      icon: 'teams',
      isConnected: false,
      configuration: {}
    },
    {
      type: 'email',
      name: 'Email (Resend)',
      description: 'Send email notifications',
      icon: 'mail',
      isConnected: false,
      configuration: {}
    },
    {
      type: 'twilio',
      name: 'Twilio SMS',
      description: 'Send SMS messages',
      icon: 'message-square',
      isConnected: false,
      configuration: {}
    }
  ]

  // Get channels to determine which integrations are configured
  const { data: channels } = await supabase
    .from('channels')
    .select('channel_type, is_enabled, configuration')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)

  if (channels) {
    channels.forEach(channel => {
      const integration = integrations.find(i => i.type === channel.channel_type)
      if (integration) {
        integration.isConnected = channel.is_enabled
        integration.configuration = channel.configuration as Record<string, unknown>
      }
    })
  }

  return NextResponse.json({ ok: true, data: integrations })
}
