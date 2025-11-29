import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type UpdatePayload = {
  name?: string
  industry?: string
  size_band?: string
  timezone?: string
  billing_email?: string
}

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
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const orgIdFromProfile = (profile as any)?.organization_id

  if (profileError || !orgIdFromProfile) {
    return NextResponse.json(
      { ok: false, error: 'User profile not found or missing organization' },
      { status: 403 }
    )
  }

  // Get organization settings
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, industry, size_band, timezone, plan_tier, billing_email, is_active')
    .eq('id', orgIdFromProfile)
    .single()

  if (orgError) {
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch organization settings' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, data: organization })
}

export async function PUT(request: Request) {
  const supabase = createServerClient()

  // Parse request body
  let body: UpdatePayload
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

  // Get user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const orgIdFromProfilePut = (profile as any)?.organization_id

  if (profileError || !orgIdFromProfilePut) {
    return NextResponse.json(
      { ok: false, error: 'User profile not found or missing organization' },
      { status: 403 }
    )
  }

  // Only org_admin can update organization settings
  if ((profile as any).role !== 'org_admin') {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions - org_admin role required' },
      { status: 403 }
    )
  }

  // Update organization settings
  const updatePayload: any = {}
  if (body.name) updatePayload.name = body.name
  if (body.industry) updatePayload.industry = body.industry
  if (body.size_band) updatePayload.size_band = body.size_band
  if (body.timezone) updatePayload.timezone = body.timezone
  if (body.billing_email !== undefined) updatePayload.billing_email = body.billing_email

  const { data, error } = await (supabase as any)
    .from('organizations')
    .update(updatePayload)
    .eq('id', orgIdFromProfilePut)
    .select()
    .single()

  if (error) {
    console.error('❌ Organization update failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('✅ Organization settings updated successfully:', {
    organization_id: orgIdFromProfilePut,
    updated_by: user.id
  })

  return NextResponse.json({ ok: true, data })
}
