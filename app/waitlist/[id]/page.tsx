'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { Loader2, Sparkles } from 'lucide-react'
import { logAnalyticsEvent } from '@/lib/analytics'
import { loadAndApplyBrandForOrg } from '@/lib/brand'

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'] })
const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600'] })

type FieldDef = {
  key: string
  label: string
  type: 'email' | 'text' | 'tel' | 'date' | 'select'
  enabled: boolean
  required: boolean
  options?: string[]
}

type FormRecord = {
  id: string
  name: string
  description?: string | null
  target_list_id?: string | null
  fields?: FieldDef[]
  settings?: Record<string, any>
  success_config?: Record<string, any>
  organization_id?: string | null
}

const defaultFields: FieldDef[] = [
  { key: 'email', label: 'Email', type: 'email', enabled: true, required: true },
]

const waitlistPresets = {
  glow: {
    background:
      'radial-gradient(110% 110% at 20% 20%, rgba(99, 102, 241, 0.28), transparent), radial-gradient(90% 90% at 80% 10%, rgba(236, 72, 153, 0.2), transparent), linear-gradient(135deg, #0b1224 0%, #0c1220 40%, #0a0f1a 100%)',
    card: 'rgba(255,255,255,0.04)',
    input: 'pill',
    button: 'gradient',
    textColor: '#f8fafc',
  },
  light: {
    background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.08), transparent 45%), linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
    card: 'rgba(255,255,255,0.8)',
    input: 'rounded',
    button: 'solid',
    textColor: '#0f172a',
  },
  mono: {
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg, #0b0f1a 0%, #0d111f 100%)',
    card: 'rgba(255,255,255,0.05)',
    input: 'pill',
    button: 'outline',
    textColor: '#e2e8f0',
  },
  photo: {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.7)), url(https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80)',
    card: 'rgba(0,0,0,0.45)',
    input: 'pill',
    button: 'solid',
    textColor: '#f8fafc',
  },
} as const

export default function WaitlistPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [form, setForm] = useState<FormRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadForm = async () => {
      const { data, error } = await supabase
        .from('signup_forms')
        .select('id, name, description, target_list_id, fields, settings, success_config, organization_id')
        .eq('id', id)
        .maybeSingle()

      if (error || !data) {
        setError('Waitlist form not found')
      } else {
        setForm(data as FormRecord)
        const enabledFields = (data.fields as FieldDef[] | null) || defaultFields
        const initial: Record<string, string> = {}
        enabledFields.filter((f) => f.enabled).forEach((f) => {
          initial[f.key] = ''
        })
        setValues(initial)
        if ((data as any).organization_id) {
          loadAndApplyBrandForOrg((data as any).organization_id as string)
        }
      }
      setLoading(false)
    }
    loadForm()
  }, [id])

  useEffect(() => {
    if (form?.id) {
      logAnalyticsEvent({
        event_type: 'form_view',
        form_id: form.id,
        organization_id: form.organization_id || null,
        metadata: { kind: 'waitlist' },
      })
    }
  }, [form?.id])

  const fields = useMemo(() => {
    const fromForm = (form?.fields as FieldDef[] | undefined) || []
    const active = fromForm.length ? fromForm.filter((f) => f.enabled) : defaultFields
    // keep email first
    const email = active.find((f) => f.key === 'email')
    const rest = active.filter((f) => f.key !== 'email')
    return email ? [email, ...rest] : active
  }, [form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    for (const field of fields) {
      if (field.required && !(values[field.key] || '').trim()) {
        setError(`${field.label || field.key} is required`)
        return
      }
    }

    setSubmitting(true)
    setError(null)
    setSubmitted(null)

    const settings = (form.settings || {}) as Record<string, any>
    const successConfig = (form.success_config || {}) as Record<string, any>

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
    logAnalyticsEvent({
      event_type: 'form_submit_error',
      form_id: id,
      organization_id: form?.organization_id || null,
      metadata: { kind: 'waitlist', message: submissionError.message },
    })
      return
    }

    const fullName = values['first_name'] || values['last_name']
      ? `${values['first_name'] || ''} ${values['last_name'] || ''}`.trim()
      : values['email']

    const metadata: Record<string, any> = {}
    Object.entries(values).forEach(([k, v]) => {
      if (k !== 'email' && v) metadata[k] = v
    })

    const { data: contact } = await supabase
      .from('recipient_contacts')
      .upsert(
        {
          email: values['email']?.trim(),
          full_name: fullName,
          phone: values['phone'] || null,
          title: values['title'] || null,
          location: values['location'] || null,
          tags: [],
          channels: ['Email'],
          metadata,
          organization_id: form?.organization_id || null,
        } as any,
        { onConflict: 'organization_id,email' }
      )
      .select('id')
      .maybeSingle()

    if (contact?.id && form.target_list_id) {
      const { error: membershipError } = await supabase
        .from('recipient_contact_memberships')
        .upsert(
          { list_id: form.target_list_id, contact_id: contact.id } as any,
          { onConflict: 'list_id,contact_id' }
        )
      if (membershipError) {
        setError(membershipError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setSubmitted(successConfig.message || 'You’re on the list!')
    const cleared: Record<string, string> = {}
    fields.forEach((f) => (cleared[f.key] = ''))
    setValues(cleared)

    if (successConfig.redirect_url) {
      router.push(successConfig.redirect_url)
    }

    logAnalyticsEvent({
      event_type: 'form_submit',
      form_id: id,
      organization_id: form?.organization_id || null,
      metadata: { kind: 'waitlist', target_list_id: form?.target_list_id },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading waitlist…
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-100">
        {error || 'Waitlist unavailable'}
      </div>
    )
  }

  const waitlistCfg = (form.settings?.waitlist as Record<string, any>) || {}
  const templateKey = (waitlistCfg.template as keyof typeof waitlistPresets) || 'glow'
  const preset = waitlistPresets[templateKey] || waitlistPresets.glow
  const headline = waitlistCfg.headline || form.name || 'Join the waitlist'
  const subhead = waitlistCfg.subhead || form.description || 'Be first to know when we launch.'
  const ctaLabel = waitlistCfg.cta_label || 'Join waitlist'
  const cardBg = preset.card
  const textColor = preset.textColor
  const inputShape = waitlistCfg.theme?.input_style || preset.input
  const buttonStyle = waitlistCfg.theme?.button_style || preset.button

  return (
    <div
      className={`min-h-screen ${display.className}`}
      style={{
        color: textColor,
        background: preset.background,
        backgroundSize: templateKey === 'photo' ? 'cover' : 'auto',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(147, 197, 253, 0.2), transparent 40%), radial-gradient(circle at 70% 10%, rgba(244, 114, 182, 0.15), transparent 35%)' }} />
        <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" />
        <header className="flex items-center justify-between px-6 md:px-10 py-6" style={{ color: textColor }}>
          <div className="flex items-center gap-3">
            {form.settings?.logo_url && (
              <img src={form.settings.logo_url} alt="logo" className="h-9 w-auto drop-shadow-lg" />
            )}
            <div className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-[0.3em] opacity-70">Early Access</span>
              <span className="text-lg font-semibold">{headline}</span>
            </div>
          </div>
          <Link href="/app">
            <button className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20 transition" style={{ color: textColor }}>
              Dashboard
            </button>
          </Link>
        </header>

        <main className={`relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 text-center ${body.className}`} style={{ color: textColor }}>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 shadow-lg">
            <Sparkles className="h-4 w-4 text-amber-300" />
            Access beta first
          </div>
          <h1 className={`mt-6 text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight ${display.className}`}>
            {headline}
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg opacity-80">
            {subhead}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 w-full max-w-2xl rounded-3xl border border-white/10 p-4 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.45)] backdrop-blur"
            style={{ backgroundColor: cardBg }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {fields.map((field) => (
                <input
                  key={field.key}
                  type={field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : field.type || 'text'}
                  placeholder={field.label}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className={`w-full border border-white/10 bg-white/10 px-4 py-3 text-sm placeholder:text-white/70 outline-none transition focus:border-white/40 focus:bg-white/15 ${
                    inputShape === 'pill' ? 'rounded-2xl' : inputShape === 'square' ? 'rounded-md' : 'rounded-xl'
                  } ${field.key === 'email' ? 'sm:flex-1' : 'sm:w-48'}`}
                  style={{ color: textColor }}
                  required={field.required}
                />
              ))}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto rounded-2xl px-6 py-3 text-sm font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  buttonStyle === 'gradient'
                    ? 'bg-gradient-to-r from-indigo-400 to-rose-400 text-slate-950 shadow-indigo-900/40 hover:shadow-indigo-700/50'
                    : buttonStyle === 'outline'
                    ? 'border border-white/40 bg-transparent text-white hover:bg-white/10'
                    : 'bg-white text-slate-900 hover:opacity-90'
                }`}
              >
                {submitting ? 'Joining…' : ctaLabel}
              </button>
            </div>
            {error && <p className="mt-3 text-left text-sm text-rose-200">{error}</p>}
            {submitted && <p className="mt-3 text-left text-sm text-emerald-200">{submitted}</p>}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-300/80">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 bg-white/5">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Limited seats for early adopters
              </span>
              <span>Instant confirmation. No spam.</span>
            </div>
          </form>

          <div className="mt-12 grid w-full gap-4 sm:grid-cols-3 text-left">
            {[
              { title: 'Designed to impress', body: 'Curated hero layouts, gradients, and button styles that feel launch-ready.' },
              { title: 'Share anywhere', body: 'Hosted link, QR code, and embed snippet to drop into your site or slides.' },
              { title: 'Auto-sync lists', body: 'Submissions flow straight into your target list with duplicate protection.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-white/5" style={{ color: textColor }}>
                <p className={`text-base font-semibold ${display.className}`}>{item.title}</p>
                <p className="mt-2 text-sm opacity-80">{item.body}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
