'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName || undefined,
        },
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/login`
            : undefined,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Depending on Supabase email confirmation settings, a session might not be created immediately.
    if (!data.session) {
      // No session yet (likely email confirmation required) – profiles will be created on first login.
      router.push('/auth/login')
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
      console.error('Failed to ensure user profile after signup:', err)
      // Non-fatal for UX; they can still proceed
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 shadow-2xl shadow-primary/10 p-8 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-amber-400 text-black h-11 w-11 shadow-soft mb-2">
            <span className="text-lg font-extrabold">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your AwareHub account</h1>
          <p className="text-sm text-muted-foreground">
            Start designing and launching internal awareness campaigns.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jordan Lee"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
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
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>Already have an account?</span>
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}


