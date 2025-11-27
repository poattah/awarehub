'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function WaitlistBuilderPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  useEffect(() => {
    router.replace(`/forms/builder/${id}`)
  }, [id, router])

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Redirecting to waitlist builder…
      <Button variant="link" onClick={() => router.replace(`/forms/builder/${id}`)}>Go now</Button>
    </div>
  )
}
