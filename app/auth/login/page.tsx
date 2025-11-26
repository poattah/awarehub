'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultRedirect = searchParams.get('redirectTo') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError || !data.session) {
      setError(authError?.message || 'Unable to sign in. Check your credentials.')
      setLoading(false)
      return
    }

    try {
      // Ensure the user has an organization + profile row in our public schema
      await fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      })
    } catch (err) {
      // Non-fatal – just log, but don't block login
      console.error('Failed to ensure user profile after login:', err)
    }

    router.push(defaultRedirect)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 shadow-2xl shadow-primary/10 p-8 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-amber-400 text-black h-11 w-11 shadow-soft mb-2">
            <span className="text-lg font-extrabold">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to AwareHub</h1>
          <p className="text-sm text-muted-foreground">
            Access your awareness campaigns, recipients, and analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>New to AwareHub?</span>
          <Link href="/auth/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  )
}


