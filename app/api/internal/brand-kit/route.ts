'use server'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = createServerClient()
  const body = await req.json().catch(() => ({}))
  const { organization_id } = body as { organization_id?: string }

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('organization_id', organization_id)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
