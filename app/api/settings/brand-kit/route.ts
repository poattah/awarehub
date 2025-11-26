import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type BrandKitPayload = {
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  heading_font?: string
  body_font?: string
  logo_url?: string
  logo_light_url?: string
  logo_dark_url?: string
  additional_styles?: Record<string, unknown>
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
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return NextResponse.json(
      { ok: false, error: 'User profile not found or missing organization' },
      { status: 403 }
    )
  }

  // Get brand kit settings
  const { data: brandKit, error: brandError } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  if (brandError) {
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch brand kit settings' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, data: brandKit })
}

export async function PUT(request: Request) {
  const supabase = createServerClient()

  // Parse request body
  let body: BrandKitPayload
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

  // Check if user has permission (org_admin or campaign_admin)
  if (!['org_admin', 'campaign_admin'].includes(profile.role)) {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Check if brand kit exists
  const { data: existingBrandKit } = await supabase
    .from('brand_kits')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  const brandKitData: any = {
    organization_id: profile.organization_id,
  }

  if (body.primary_color) brandKitData.primary_color = body.primary_color
  if (body.secondary_color) brandKitData.secondary_color = body.secondary_color
  if (body.accent_color) brandKitData.accent_color = body.accent_color
  if (body.heading_font) brandKitData.heading_font = body.heading_font
  if (body.body_font) brandKitData.body_font = body.body_font
  if (body.logo_url !== undefined) brandKitData.logo_url = body.logo_url
  if (body.additional_styles) brandKitData.additional_styles = body.additional_styles

  let data, error

  if (existingBrandKit) {
    // Update existing brand kit
    const result = await supabase
      .from('brand_kits')
      .update(brandKitData)
      .eq('id', existingBrandKit.id)
      .select()
      .single()

    data = result.data
    error = result.error
  } else {
    // Create new brand kit
    const result = await supabase
      .from('brand_kits')
      .insert(brandKitData)
      .select()
      .single()

    data = result.data
    error = result.error
  }

  if (error) {
    console.error('❌ Brand kit update failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('✅ Brand kit updated successfully:', {
    organization_id: profile.organization_id,
    updated_by: user.id
  })

  return NextResponse.json({ ok: true, data })
}
