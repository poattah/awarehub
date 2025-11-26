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
  const supabase = createServerClient()

  // Parse request body
  let body: Payload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 })
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

  const upsertPayload = {
    id: body.id,
    organization_id: profile.organization_id,
    created_by: user.id,
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
    .select('id, status, organization_id')
    .single()

  if (error) {
    console.error('❌ Campaign save failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('✅ Campaign saved successfully:', {
    id: data?.id,
    status: data?.status,
    organization_id: data?.organization_id,
    user_id: user.id
  })

  return NextResponse.json({ ok: true, id: data?.id, status: data?.status })
}
