'use server'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = createServerClient()
  const body = await req.json()
  const {
    organization_id,
    name,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    text_color,
    font_family_heading,
    font_family_body,
    font_custom_name,
    font_custom_url,
    logo_url,
    button_style,
    brand_kit_id,
  } = body || {}

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
  }

  const payload: any = {
    organization_id,
    name,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    text_color,
    font_family_heading,
    font_family_body,
    font_custom_name,
    font_custom_url,
    logo_url,
    button_style,
    is_default: true,
  }

  let result
  if (brand_kit_id) {
    result = await (supabase as any)
      .from('brand_kits')
      .update(payload)
      .eq('id', brand_kit_id)
      .eq('organization_id', organization_id)
      .select('*')
      .maybeSingle()
  } else {
    result = await (supabase as any)
      .from('brand_kits')
      .insert(payload)
      .select('*')
      .maybeSingle()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ data: result.data })
}
