'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type FormRecord = {
  id: string
  name: string
  description?: string | null
  target_list_id?: string | null
  fields?: Record<string, any>
  settings?: Record<string, any>
  success_config?: Record<string, any>
}

export default function SignupFormPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [form, setForm] = useState<FormRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    title: '',
    location: '',
  })

  useEffect(() => {
    const loadForm = async () => {
      const { data, error } = await supabase
        .from('signup_forms')
        .select('id, name, description, target_list_id, fields, settings, success_config')
        .eq('id', id)
        .maybeSingle()
      if (error || !data) {
        setError('Form not found')
      } else {
        setForm(data as FormRecord)
      }
      setLoading(false)
    }
    loadForm()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.email.trim()) {
      setError('Email is required')
      return
    }
    setSubmitting(true)
    setError(null)
    setSubmitted(null)

    const settings = (form?.settings || {}) as Record<string, any>
    const successConfig = (form?.success_config || {}) as Record<string, any>

    // Record submission
    const submissionPayload = {
      form_id: id,
      data: values,
      status: settings.double_opt_in ? 'pending' : 'confirmed',
      ip_address: '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
    }

    const { error: submissionError } = await supabase
      .from('signup_form_submissions')
      .insert(submissionPayload as any)

    if (submissionError) {
      setError(submissionError.message)
      setSubmitting(false)
      return
    }

    // Upsert contact and membership
    const fullName =
      `${values.first_name} ${values.last_name}`.trim() || values.email
    const metadata: Record<string, string> = {}
    if (values.first_name) metadata.first_name = values.first_name
    if (values.last_name) metadata.last_name = values.last_name
    if (values.phone) metadata.phone = values.phone
    if (values.title) metadata.title = values.title
    if (values.location) metadata.location = values.location

    const { data: contact } = await supabase
      .from('recipient_contacts')
      .upsert(
        {
          email: values.email.trim(),
          full_name: fullName,
          phone: values.phone || null,
          title: values.title || null,
          location: values.location || null,
          tags: [],
          channels: ['Email'],
          metadata,
        } as any,
        { onConflict: 'email' }
      )
      .select('id')
      .maybeSingle()

    if (contact?.id && form?.target_list_id) {
      await supabase
        .from('recipient_contact_memberships')
        .upsert(
          { list_id: form.target_list_id, contact_id: contact.id } as any,
          { onConflict: 'list_id,contact_id' }
        )
    }

    setSubmitting(false)
    setSubmitted(successConfig.message || 'Thanks for signing up!')
    setValues({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      title: '',
      location: '',
    })

    if (successConfig.redirect_url) {
      router.push(successConfig.redirect_url)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading form...</div>
  }

  if (error || !form) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Form unavailable'}</div>
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-border/70 p-6 shadow-soft-lg bg-white">
        <div className="space-y-2 mb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Signup form</p>
          <h1 className="text-2xl font-bold">{form.name}</h1>
          {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email *</label>
            <Input
              type="email"
              required
              value={values.email}
              onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">First name</label>
              <Input
                value={values.first_name}
                onChange={(e) => setValues((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Last name</label>
              <Input
                value={values.last_name}
                onChange={(e) => setValues((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={values.phone}
              onChange={(e) => setValues((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Job title</label>
            <Input
              value={values.title}
              onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Marketing Manager"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <Input
              value={values.location}
              onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="City, Country"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked readOnly className="h-3 w-3" />
              {form.settings?.consent_text || 'I agree to receive updates.'}
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {submitted && <p className="text-sm text-green-600">{submitted}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
