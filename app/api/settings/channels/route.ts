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

  const orgIdFromProfile = (profile as any)?.organization_id

  if (profileError || !orgIdFromProfile) {
    return NextResponse.json(
      { ok: false, error: 'User profile not found or missing organization' },
      { status: 403 }
    )
  }

  // Get all channels for the organization
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*')
    .eq('organization_id', orgIdFromProfile)
    .is('deleted_at', null)

  if (channelsError) {
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, data: channels || [] })
}
