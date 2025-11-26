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
  fields?: any
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
  const [values, setValues] = useState<Record<string, string>>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    date_of_birth: '',
    gender: '',
    address_street_address: '',
    address_apartment: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    title: '',
    location: '',
    job_title: '',
    company_name: '',
    industry: '',
    team_size: '',
    work_phone: '',
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
    const fieldConfig = (form?.fields || [{ key: 'email', enabled: true, required: true }]) as any[]
    for (const cfg of fieldConfig) {
      if (cfg.enabled && cfg.required && !(values[cfg.key] || '').trim()) {
        setError(`${cfg.label || cfg.key.replace('_', ' ')} is required`)
        return
      }
      if (cfg.type === 'address' && cfg.children) {
        for (const child of cfg.children) {
          if (child.enabled && child.required && !(values[`address_${child.key}`] || '').trim()) {
            setError(`${child.label || child.key.replace('_', ' ')} is required`)
            return
          }
        }
      }
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
      `${values.first_name || ''} ${values.last_name || ''}`.trim() || values.email

    const metadata: Record<string, any> = {}
    Object.entries(values).forEach(([k, v]) => {
      if (k !== 'email' && !k.startsWith('address_') && v) metadata[k] = v
    })
    const addressFields = ['street_address', 'apartment', 'city', 'state', 'postal_code']
    const address: Record<string, string> = {}
    addressFields.forEach((f) => {
      const key = `address_${f}`
      if (values[key]) address[f] = values[key]
    })
    if (Object.keys(address).length) {
      metadata.address = address
    }

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
          {(form.fields as any[] | undefined)?.filter((cfg) => cfg.enabled).map((cfg) => {
            if (cfg.type === 'select') {
              return (
                <div key={cfg.key} className="space-y-1">
                  <label className="text-sm font-medium">
                    {cfg.label}{cfg.required ? ' *' : ''}
                  </label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    required={cfg.required}
                    value={values[cfg.key] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [cfg.key]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {(cfg.options || ['male','female','non-binary','prefer_not_to_say','other']).map((opt: string) => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (cfg.type === 'address') {
              const children = cfg.children || []
              return (
                <div key={cfg.key} className="space-y-2 rounded-lg border border-border/60 p-3 bg-muted/20">
                  <p className="text-sm font-semibold">{cfg.label}{cfg.required ? ' *' : ''}</p>
                  {children
                    .filter((c: any) => c.enabled)
                    .map((child: any) => (
                      <div key={child.key} className="space-y-1">
                        <label className="text-sm font-medium">
                          {child.label}
                          {child.required ? ' *' : ''}
                        </label>
                        <Input
                          required={child.required}
                          value={values[`address_${child.key}`] || ''}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [`address_${child.key}`]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                </div>
              )
            }

            return (
              <div key={cfg.key} className="space-y-1">
                <label className="text-sm font-medium">
                  {cfg.label}{cfg.required ? ' *' : ''}
                </label>
                <Input
                  type={cfg.type === 'email' ? 'email' : cfg.type === 'tel' ? 'tel' : cfg.type === 'date' ? 'date' : 'text'}
                  required={cfg.required}
                  value={values[cfg.key] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [cfg.key]: e.target.value,
                    }))
                  }
                  placeholder={
                    cfg.key === 'email'
                      ? 'you@example.com'
                      : cfg.key === 'phone' || cfg.key === 'work_phone'
                      ? '+1 (555) 123-4567'
                      : cfg.key === 'job_title' || cfg.key === 'title'
                      ? 'e.g., Marketing Manager'
                      : cfg.key === 'location' || cfg.key === 'country'
                      ? 'City, Country'
                      : ''
                  }
                />
              </div>
            )
          })}
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
