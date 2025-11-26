import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

type UpdateMemberPayload = {
  role?: 'org_admin' | 'campaign_admin' | 'editor' | 'viewer'
  full_name?: string
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = createServerClient()

  // Parse request body
  let body: UpdateMemberPayload
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

  // Only org_admin can update team members
  if (profile.role !== 'org_admin') {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions - org_admin role required' },
      { status: 403 }
    )
  }

  // Verify the target user belongs to the same organization
  const { data: targetUser, error: targetError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (targetError || targetUser?.organization_id !== profile.organization_id) {
    return NextResponse.json(
      { ok: false, error: 'User not found in your organization' },
      { status: 404 }
    )
  }

  // Prevent removing the last org_admin
  if (body.role && body.role !== 'org_admin') {
    const { data: adminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('role', 'org_admin')
      .is('deleted_at', null)

    if (adminCount && adminCount.length === 1) {
      const { data: lastAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'org_admin')
        .single()

      if (lastAdmin?.id === userId) {
        return NextResponse.json(
          { ok: false, error: 'Cannot change role of the last organization admin' },
          { status: 400 }
        )
      }
    }
  }

  // Update the team member
  const updatePayload: any = {}
  if (body.role) updatePayload.role = body.role
  if (body.full_name) updatePayload.full_name = body.full_name

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('❌ Team member update failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('✅ Team member updated successfully:', {
    user_id: userId,
    updated_by: user.id
  })

  return NextResponse.json({ ok: true, data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
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

  // Only org_admin can remove team members
  if (profile.role !== 'org_admin') {
    return NextResponse.json(
      { ok: false, error: 'Insufficient permissions - org_admin role required' },
      { status: 403 }
    )
  }

  // Cannot remove yourself
  if (userId === user.id) {
    return NextResponse.json(
      { ok: false, error: 'Cannot remove yourself from the team' },
      { status: 400 }
    )
  }

  // Verify the target user belongs to the same organization
  const { data: targetUser, error: targetError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (targetError || targetUser?.organization_id !== profile.organization_id) {
    return NextResponse.json(
      { ok: false, error: 'User not found in your organization' },
      { status: 404 }
    )
  }

  // Soft delete the user
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('❌ Team member removal failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('✅ Team member removed successfully:', {
    user_id: userId,
    removed_by: user.id
  })

  return NextResponse.json({ ok: true })
}
