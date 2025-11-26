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

  // Get or create user's profile + organization so RLS + FKs work
  let organizationId: string | null = null
  try {
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profileError && existingProfile?.organization_id) {
      organizationId = existingProfile.organization_id as string
    } else {
      // Auto-bootstrap a lightweight org + profile for this user
      const orgSlug =
        (process.env.NEXT_PUBLIC_ORG_SLUG && `${process.env.NEXT_PUBLIC_ORG_SLUG}-${user.id.slice(0, 8)}`) ||
        `awarehub-${user.id.slice(0, 8)}`

      const orgName =
        process.env.NEXT_PUBLIC_ORG_NAME ||
        (user.user_metadata?.full_name as string | undefined) ||
        (user.email ?? 'AwareHub Organization')

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .upsert(
          {
            slug: orgSlug,
            name: orgName,
          },
          { onConflict: 'slug' }
        )
        .select('id')
        .single()

      if (orgError || !org?.id) {
        console.error('❌ Failed to upsert organization for user:', orgError)
        return NextResponse.json(
          { ok: false, error: 'Could not determine organization for user' },
          { status: 500 }
        )
      }

      const { error: upsertProfileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            organization_id: org.id,
            email: user.email ?? '',
            full_name:
              (user.user_metadata?.full_name as string | undefined) ||
              (user.email ?? 'AwareHub User'),
          },
          { onConflict: 'id' }
        )

      if (upsertProfileError) {
        console.error('❌ Failed to upsert profile for user:', upsertProfileError)
        return NextResponse.json(
          { ok: false, error: 'Could not create profile for user' },
          { status: 500 }
        )
      }

      organizationId = org.id as string
    }
  } catch (err) {
    console.error('❌ Error resolving user organization/profile:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to resolve user organization' },
      { status: 500 }
    )
  }

  if (!organizationId) {
    return NextResponse.json(
      { ok: false, error: 'User organization could not be determined' },
      { status: 500 }
    )
  }

  const upsertPayload = {
    id: body.id,
    organization_id: organizationId,
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
