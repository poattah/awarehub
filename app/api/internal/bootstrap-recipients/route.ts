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

  const { count, error: listCountError } = await supabase
    .from('recipient_lists')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  if (listCountError) {
    return NextResponse.json({ ok: false, error: listCountError.message }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, seeded: false, message: 'Recipient lists already exist.' })
  }

  const lists = [
    { name: 'All Employees', type: 'List', tags: ['Org-wide'], member_count: 3 },
    { name: 'Safety Champions', type: 'List', tags: ['Safety'], member_count: 1 },
  ].map((l) => ({ ...l, organization_id: org.id }))

  const { data: insertedLists, error: insertListsError } = await supabase
    .from('recipient_lists')
    .insert(lists)
    .select('id, name')

  if (insertListsError || !insertedLists?.length) {
    return NextResponse.json({ ok: false, error: insertListsError?.message || 'lists_insert_failed' }, { status: 500 })
  }

  const contacts = [
    {
      full_name: 'Jordan Lee',
      email: 'jordan.lee@awarehub.com',
      phone: '+1 (415) 555-0199',
      title: 'Employee Experience Lead',
      location: 'San Francisco, CA • PST',
      tags: ['Managers & Leads', 'Remote'],
      channels: ['Email', 'Slack DM'],
    },
    {
      full_name: 'Priya Desai',
      email: 'priya.desai@awarehub.com',
      phone: '+1 (917) 555-1200',
      title: 'Director, DEI',
      location: 'New York, NY • EST',
      tags: ['DEI', 'Org-wide'],
      channels: ['Email', 'Teams'],
    },
    {
      full_name: 'Mateo Alvarez',
      email: 'mateo.alvarez@awarehub.com',
      phone: '+44 20 7946 0101',
      title: 'Security Analyst',
      location: 'London, UK • GMT',
      tags: ['Security', 'Remote'],
      channels: ['Email'],
    },
    {
      full_name: 'Kara Mills',
      email: 'kara.mills@awarehub.com',
      phone: '+1 (713) 555-8822',
      title: 'Safety Lead',
      location: 'Houston, TX • CST',
      tags: ['Safety'],
      channels: ['Email', 'Slack DM'],
    },
  ].map((c) => ({ ...c, organization_id: org.id }))

  const { data: insertedContacts, error: contactsError } = await supabase
    .from('recipient_contacts')
    .insert(contacts)
    .select('id, email')

  if (contactsError || !insertedContacts?.length) {
    return NextResponse.json({ ok: false, error: contactsError?.message || 'contacts_insert_failed' }, { status: 500 })
  }

  const allEmployeesId = insertedLists.find((l) => l.name === 'All Employees')?.id
  const safetyId = insertedLists.find((l) => l.name === 'Safety Champions')?.id

  const memberships = insertedContacts.flatMap((c) => {
    if (c.email === 'kara.mills@awarehub.com' && safetyId) {
      return [{ list_id: safetyId, contact_id: c.id }]
    }
    if (allEmployeesId) {
      return [{ list_id: allEmployeesId, contact_id: c.id }]
    }
    return []
  })

  if (memberships.length) {
    const { error: membershipError } = await supabase
      .from('recipient_contact_memberships')
      .insert(memberships)

    if (membershipError) {
      return NextResponse.json({ ok: false, error: membershipError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, seeded: true, lists: insertedLists.length, contacts: insertedContacts.length })
}
