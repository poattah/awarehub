'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { CheckCircle2 } from 'lucide-react'

type FieldConfig = {
  enabled: boolean
  required: boolean
  label: string
  placeholder: string
}

type FormFields = Record<string, FieldConfig>

type FormData = {
  id: string
  name: string
  description: string
  fields: FormFields
  branding: {
    primary_color: string
    button_text: string
    logo_url: string | null
    background_style: 'solid' | 'gradient' | 'light'
  }
  consent_options: {
    gdpr_enabled: boolean
    gdpr_text: string
    terms_enabled: boolean
    terms_url: string | null
    privacy_enabled: boolean
    privacy_url: string | null
  }
  success_config: {
    message: string
    redirect_url: string | null
  }
  settings: {
    double_opt_in: boolean
  }
}

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.formId as string

  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [gdprConsent, setGdprConsent] = useState(false)

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await supabase
        .from('signup_forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        setError('Form not found or no longer active')
      } else {
        setForm(data as FormData)
      }
      setLoading(false)
    }

    fetchForm()
  }, [formId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setError(null)

    // Validate GDPR consent
    if (form.consent_options.gdpr_enabled && !gdprConsent) {
      setError('Please accept the consent agreement')
      return
    }

    // Validate required fields
    for (const [key, config] of Object.entries(form.fields)) {
      if (config.enabled && config.required && !formValues[key]?.trim()) {
        setError(`${config.label} is required`)
        return
      }
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: formValues,
          ip: null,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to submit form')
        setSubmitting(false)
        return
      }

      setSuccess(true)

      // Redirect if configured
      if (result.redirect_url) {
        setTimeout(() => {
          window.location.href = result.redirect_url
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Form Not Available</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!form) return null

  const bgClass =
    form.branding.background_style === 'gradient'
      ? 'bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10'
      : form.branding.background_style === 'light'
      ? 'bg-muted/30'
      : 'bg-white'

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass} px-4`}>
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div
            className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${form.branding.primary_color}20` }}
          >
            <CheckCircle2
              className="h-8 w-8"
              style={{ color: form.branding.primary_color }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">Success!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {form.success_config.message}
            </p>
            {form.settings.double_opt_in && (
              <p className="text-xs text-muted-foreground mt-2">
                Please check your email to confirm your subscription.
              </p>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgClass} px-4 py-8`}>
      <Card className="max-w-md w-full p-8">
        {form.branding.logo_url && (
          <div className="flex justify-center mb-6">
            <img
              src={form.branding.logo_url}
              alt="Logo"
              className="h-12 object-contain"
            />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{form.name}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(form.fields).map(([key, config]) => {
            if (!config.enabled) return null

            return (
              <div key={key} className="space-y-1">
                <Label className="text-sm">
                  {config.label}
                  {config.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                  placeholder={config.placeholder}
                  value={formValues[key] || ''}
                  onChange={(e) =>
                    setFormValues({ ...formValues, [key]: e.target.value })
                  }
                  required={config.required}
                />
              </div>
            )
          })}

          {form.consent_options.gdpr_enabled && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-0.5 rounded"
                required
              />
              <span>{form.consent_options.gdpr_text}</span>
            </label>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: form.branding.primary_color }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Submitting...
              </>
            ) : (
              form.branding.button_text
            )}
          </Button>

          {(form.consent_options.privacy_enabled || form.consent_options.terms_enabled) && (
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              {form.consent_options.privacy_enabled && form.consent_options.privacy_url && (
                <a
                  href={form.consent_options.privacy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Privacy Policy
                </a>
              )}
              {form.consent_options.privacy_enabled &&
                form.consent_options.terms_enabled && <span>•</span>}
              {form.consent_options.terms_enabled && form.consent_options.terms_url && (
                <a
                  href={form.consent_options.terms_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Terms & Conditions
                </a>
              )}
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">AwareHub</span>
          </p>
        </div>
      </Card>
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}
