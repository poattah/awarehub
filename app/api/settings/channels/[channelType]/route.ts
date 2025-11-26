import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type ChannelPayload = {
  is_enabled?: boolean
  configuration?: Record<string, unknown>
}

export async function PUT(
  request: Request,
  { params }: { params: { channelType: string } }
) {
  const supabase = createServerClient()

  // Parse request body
  let body: ChannelPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

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

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return NextResponse.json(
      { ok: false, error: 'User profile not found or missing organization' },
      { status: 403 }
    )
  }

  // Only org_admin can configure channels
  if (profile.role !== 'org_admin') {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions - org_admin role required' },
      { status: 403 }
    )
  }

  // Check if channel exists
  const { data: existingChannel } = await supabase
    .from('channels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('channel_type', params.channelType)
    .maybeSingle()

  const channelData: any = {
    organization_id: profile.organization_id,
    channel_type: params.channelType,
  }

  if (body.is_enabled !== undefined) channelData.is_enabled = body.is_enabled
  if (body.configuration) channelData.configuration = body.configuration

  let data, error

  if (existingChannel) {
    // Update existing channel
    const result = await supabase
      .from('channels')
      .update(channelData)
      .eq('id', existingChannel.id)
      .select()
      .single()

    data = result.data
    error = result.error
  } else {
    // Create new channel
    channelData.is_enabled = body.is_enabled !== undefined ? body.is_enabled : true
    const result = await supabase
      .from('channels')
      .insert(channelData)
      .select()
      .single()

    data = result.data
    error = result.error
  }

  if (error) {
    console.error('❌ Channel configuration failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('✅ Channel configured successfully:', {
    channel_type: params.channelType,
    organization_id: profile.organization_id,
    configured_by: user.id
  })

  return NextResponse.json({ ok: true, data })
}
