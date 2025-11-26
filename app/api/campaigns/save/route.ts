import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type Payload = {
  id?: string
  name: string
  summary?: string
  launchDate?: string
  cadence?: string
  assetType?: string
  channels?: string[]
  audience?: string[]
  theme?: string
  tone?: string
  status?: 'draft' | 'active' | 'scheduled' | 'completed'
  metadata?: Record<string, unknown>
}

export async function POST(request: Request) {
  const orgId = process.env.SUPABASE_ORG_ID
  const profileId = process.env.SUPABASE_PROFILE_ID
  if (!orgId || !profileId) {
    return NextResponse.json(
      { ok: false, error: 'Missing SUPABASE_ORG_ID or SUPABASE_PROFILE_ID env' },
      { status: 500 }
    )
  }

  const supabase = createServerClient()

  let body: Payload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 })
  }

  const upsertPayload = {
    id: body.id,
    organization_id: orgId,
    created_by: profileId,
    name: body.name,
    description: body.summary || '',
    status: body.status || 'draft',
    start_at: body.launchDate ? new Date(body.launchDate).toISOString() : null,
    metadata: {
      cadence: body.cadence,
      assetType: body.assetType,
      channels: body.channels || [],
      audience: body.audience || [],
      theme: body.theme,
      tone: body.tone,
      ...body.metadata,
    },
  }

  const { data, error } = await supabase
    .from('campaigns')
    .upsert(upsertPayload, { onConflict: 'id' })
    .select('id, status')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id, status: data?.status })
}
