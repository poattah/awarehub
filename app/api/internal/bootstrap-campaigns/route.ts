'use server'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Auto-seed disabled in production.' }, { status: 403 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    )
  }

  const supabase = createServerClient()

  const orgSlug = process.env.NEXT_PUBLIC_ORG_SLUG || 'awarehub-demo'
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || 'AwareHub Demo'
  const seedEmail = process.env.NEXT_PUBLIC_SEED_EMAIL || 'demo@awarehub.com'
  const seedName = process.env.NEXT_PUBLIC_SEED_NAME || 'Demo User'

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .upsert({ slug: orgSlug, name: orgName }, { onConflict: 'slug' })
    .select('id')
    .single()

  if (orgError || !org) {
    return NextResponse.json({ ok: false, error: orgError?.message || 'org_upsert_failed' }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        organization_id: org.id,
        email: seedEmail,
        full_name: seedName,
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ ok: false, error: profileError?.message || 'profile_upsert_failed' }, { status: 500 })
  }

  const { count, error: countError } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  if (countError) {
    return NextResponse.json({ ok: false, error: countError.message }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, seeded: false, message: 'Campaigns already exist.' })
  }

  const rows = [
    {
      organization_id: org.id,
      created_by: profile.id,
      name: 'Mental Health Awareness Week',
      description: 'Promote mental health resources and peer sessions.',
      status: 'active',
      start_at: '2024-05-06T09:00:00Z',
      end_at: '2024-05-12T23:59:00Z',
      primary_category: 'Mental Health',
      tags: ['Wellness', 'Employees'],
      metadata: {
        channels: ['Email', 'Slack', 'Intranet'],
        engagement: 42,
        reach: 1240,
        asset_image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
      },
    },
    {
      organization_id: org.id,
      created_by: profile.id,
      name: 'Pride Month Celebration',
      description: 'Celebrate inclusion throughout June.',
      status: 'scheduled',
      start_at: '2024-06-01T09:00:00Z',
      end_at: '2024-06-30T23:59:00Z',
      primary_category: 'DEI',
      tags: ['Inclusion', 'Culture'],
      metadata: {
        channels: ['Slack', 'Teams', 'Email'],
        engagement: 0,
        reach: 0,
        asset_image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=320&q=80',
      },
    },
    {
      organization_id: org.id,
      created_by: profile.id,
      name: 'Safety Champions Kickoff',
      description: 'Launch the safety ambassadors program.',
      status: 'draft',
      start_at: null,
      end_at: null,
      primary_category: 'Safety',
      tags: ['Safety', 'Onsite'],
      metadata: {
        channels: ['Slack'],
        engagement: 0,
        reach: 0,
        asset_image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=320&q=80',
      },
    },
  ]

  const { error: insertError } = await supabase.from('campaigns').insert(rows)

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, seeded: true, inserted: rows.length })
}
