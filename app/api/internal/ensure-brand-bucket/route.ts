'use server'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const BUCKET = 'brand-assets'

export async function POST() {
  const supabase = createServerClient()

  // Check if bucket exists
  const { data: existing } = await supabase.storage.getBucket(BUCKET)
  if (existing) {
    return NextResponse.json({ ok: true, bucket: BUCKET })
  }

  // Create bucket (public so we can read logos without signed URLs)
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '10MB',
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, bucket: BUCKET })
}
