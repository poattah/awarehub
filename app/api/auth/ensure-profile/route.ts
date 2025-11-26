import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createServerClient()

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { ok: false, error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized - invalid or expired token' },
      { status: 401 }
    )
  }

  try {
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profileError && existingProfile?.organization_id) {
      return NextResponse.json({ ok: true, alreadyExists: true })
    }

    // Create a lightweight organization + profile for this user
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
      console.error('❌ ensure-profile: failed to upsert organization:', orgError)
      return NextResponse.json(
        { ok: false, error: 'Could not create organization for user' },
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
      console.error('❌ ensure-profile: failed to upsert profile:', upsertProfileError)
      return NextResponse.json(
        { ok: false, error: 'Could not create profile for user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, created: true })
  } catch (err) {
    console.error('❌ ensure-profile: unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error while ensuring profile' },
      { status: 500 }
    )
  }
}


