'use server'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getOrgIdFromUser(token?: string) {
  if (!token) return null
  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userResp } = await supabase.auth.getUser()
  const user = userResp.user
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()
  return profile?.organization_id || null
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.replace('Bearer ', '') : null
  const orgId = await getOrgIdFromUser(token || undefined)
  if (!orgId) return NextResponse.json({ ok: false, error: 'Missing organization or auth' }, { status: 401 })

  const supabase = createClient(supabaseUrl, serviceKey)
  const body = await request.json()
  const { role, status } = body as { role?: string; status?: string }

  const updates: Record<string, any> = {}
  if (role) updates.role = role
  if (status) updates.status = status

  const { error } = await supabase
    .from('team_invites')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.replace('Bearer ', '') : null
  const orgId = await getOrgIdFromUser(token || undefined)
  if (!orgId) return NextResponse.json({ ok: false, error: 'Missing organization or auth' }, { status: 401 })

  const supabase = createClient(supabaseUrl, serviceKey)
  const { error } = await supabase
    .from('team_invites')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
