'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import {
  X,
  Eye,
  Code,
  Palette,
  Settings,
  FileText,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  User,
  Phone,
  MapPin,
  Briefcase,
  Building2,
} from 'lucide-react'

type FieldConfig = {
  enabled: boolean
  required: boolean
  label: string
  placeholder: string
}

type FormFields = {
  email: FieldConfig
  first_name: FieldConfig
  last_name: FieldConfig
  phone: FieldConfig
  title: FieldConfig
  location: FieldConfig
  department: FieldConfig
}

type BrandingConfig = {
  primary_color: string
  button_text: string
  logo_url: string | null
  background_style: 'solid' | 'gradient' | 'light'
}

type ConsentOptions = {
  gdpr_enabled: boolean
  gdpr_text: string
  terms_enabled: boolean
  terms_url: string | null
  privacy_enabled: boolean
  privacy_url: string | null
}

type SuccessConfig = {
  message: string
  redirect_url: string | null
}

type FormSettings = {
  double_opt_in: boolean
  send_welcome_email: boolean
  allow_duplicates: boolean
  rate_limit: number
}

type SignupFormData = {
  name: string
  description: string
  target_list_id: string | null
  fields: FormFields
  branding: BrandingConfig
  consent_options: ConsentOptions
  success_config: SuccessConfig
  settings: FormSettings
}

type List = {
  id: string
  name: string
}

const FIELD_ICONS = {
  email: Mail,
  first_name: User,
  last_name: User,
  phone: Phone,
  title: Briefcase,
  location: MapPin,
  department: Building2,
}

const defaultFields: FormFields = {
  email: { enabled: true, required: true, label: 'Email', placeholder: 'your@email.com' },
  first_name: { enabled: true, required: true, label: 'First Name', placeholder: 'John' },
  last_name: { enabled: true, required: true, label: 'Last Name', placeholder: 'Doe' },
  phone: { enabled: false, required: false, label: 'Phone', placeholder: '+1 (555) 000-0000' },
  title: { enabled: false, required: false, label: 'Job Title', placeholder: 'Software Engineer' },
  location: { enabled: false, required: false, label: 'Location', placeholder: 'San Francisco, CA' },
  department: { enabled: false, required: false, label: 'Department', placeholder: 'Engineering' },
}

const defaultBranding: BrandingConfig = {
  primary_color: '#f59e0b',
  button_text: 'Subscribe',
  logo_url: null,
  background_style: 'gradient',
}

const defaultConsent: ConsentOptions = {
  gdpr_enabled: true,
  gdpr_text: 'I consent to receiving communications and understand I can unsubscribe at any time.',
  terms_enabled: false,
  terms_url: null,
  privacy_enabled: true,
  privacy_url: null,
}

const defaultSuccess: SuccessConfig = {
  message: 'Thanks for subscribing! Check your email for confirmation.',
  redirect_url: null,
}

const defaultSettings: FormSettings = {
  double_opt_in: true,
  send_welcome_email: true,
  allow_duplicates: false,
  rate_limit: 10,
}

export function SignupFormBuilder({
  onClose,
  onSuccess,
  lists,
}: {
  onClose: () => void
  onSuccess?: () => void
  lists: List[]
}) {
  const [step, setStep] = useState<'config' | 'fields' | 'branding' | 'consent' | 'preview'>('config')
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    description: '',
    target_list_id: null,
    fields: defaultFields,
    branding: defaultBranding,
    consent_options: defaultConsent,
    success_config: defaultSuccess,
    settings: defaultSettings,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmbedCode, setShowEmbedCode] = useState(false)
  const [createdFormId, setCreatedFormId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const steps = [
    { id: 'config', label: 'Basic Info', icon: FileText },
    { id: 'fields', label: 'Form Fields', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'consent', label: 'Consent & Compliance', icon: CheckCircle2 },
    { id: 'preview', label: 'Preview & Publish', icon: Eye },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    try {
      // Get current user's organization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setSaving(false)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single()

      if (!profile) {
        setError('User profile not found')
        setSaving(false)
        return
      }

      const { data, error: insertError } = await supabase
        .from('signup_forms')
        .insert({
          organization_id: profile.organization_id,
          name: formData.name,
          description: formData.description,
          target_list_id: formData.target_list_id,
          fields: formData.fields,
          branding: formData.branding,
          consent_options: formData.consent_options,
          success_config: formData.success_config,
          settings: formData.settings,
          created_by: session.user.id,
        })
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }

      setCreatedFormId(data.id)
      setShowEmbedCode(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form')
    } finally {
      setSaving(false)
    }
  }

  const getEmbedCode = () => {
    if (!createdFormId) return ''
    const baseUrl = window.location.origin
    return `<!-- AwareHub Signup Form -->
<div id="awarehub-signup-form"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/forms/embed/${createdFormId}';
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.minHeight = '500px';
    document.getElementById('awarehub-signup-form').appendChild(iframe);
  })();
</script>`
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-border/70 bg-card shadow-soft-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/40">
          <div>
            <h2 className="text-lg font-bold">Create Signup Form</h2>
            <p className="text-sm text-muted-foreground">Build a form to capture new subscribers</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step Indicator */}
        {!showEmbedCode && (
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60 overflow-x-auto">
            {steps.map((s, idx) => {
              const StepIcon = s.icon
              const isActive = s.id === step
              const isCompleted = idx < currentStepIndex

              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                  {s.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showEmbedCode ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Form Created Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your signup form is ready. Copy the embed code below to add it to your website.
                </p>
              </div>

              <Card className="p-4 space-y-3 border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Embed Code</Label>
                  <Button variant="outline" size="sm" onClick={copyEmbedCode}>
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{getEmbedCode()}</code>
                  </pre>
                </div>
              </Card>

              <Card className="p-4 space-y-3 border-border/60">
                <Label className="text-sm font-semibold">Direct Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/forms/${createdFormId}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/forms/${createdFormId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => window.open(`/forms/${createdFormId}`, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Form
                </Button>
              </div>
            </div>
          ) : step === 'config' ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="space-y-2">
                <Label>Form Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Newsletter Signup, Event Registration"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this form for?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Target List</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  New subscribers will be automatically added to this list
                </p>
                <select
                  value={formData.target_list_id || ''}
                  onChange={(e) => setFormData({ ...formData, target_list_id: e.target.value || null })}
                  className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a list (optional)</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : step === 'fields' ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="space-y-2">
                <h3 className="font-semibold">Configure Form Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which fields to include and whether they're required
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(formData.fields).map(([key, field]) => {
                  const FieldIcon = FIELD_ICONS[key as keyof typeof FIELD_ICONS]
                  return (
                    <Card key={key} className="p-4 border-border/60">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FieldIcon className="h-5 w-5 text-primary" />
                            <span className="font-semibold capitalize">{key.replace('_', ' ')}</span>
                            {key === 'email' && <Badge variant="outline">Always Required</Badge>}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fields: {
                                      ...formData.fields,
                                      [key]: { ...field, required: e.target.checked },
                                    },
                                  })
                                }
                                disabled={key === 'email'}
                                className="rounded"
                              />
                              Required
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={field.enabled}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fields: {
                                      ...formData.fields,
                                      [key]: { ...field, enabled: e.target.checked },
                                    },
                                  })
                                }
                                disabled={key === 'email'}
                                className="rounded"
                              />
                              Enabled
                            </label>
                          </div>
                        </div>
                        {field.enabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Field Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fields: {
                                      ...formData.fields,
                                      [key]: { ...field, label: e.target.value },
                                    },
                                  })
                                }
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Placeholder</Label>
                              <Input
                                value={field.placeholder}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fields: {
                                      ...formData.fields,
                                      [key]: { ...field, placeholder: e.target.value },
                                    },
                                  })
                                }
                                className="h-9"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : step === 'branding' ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="space-y-2">
                <h3 className="font-semibold">Customize Form Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Match your brand with colors and styling options
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.branding.primary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branding: { ...formData.branding, primary_color: e.target.value },
                        })
                      }
                      className="h-10 w-20 rounded-lg border border-border/60 cursor-pointer"
                    />
                    <Input
                      value={formData.branding.primary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branding: { ...formData.branding, primary_color: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input
                    value={formData.branding.button_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, button_text: e.target.value },
                      })
                    }
                    placeholder="Subscribe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo URL (optional)</Label>
                  <Input
                    value={formData.branding.logo_url || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, logo_url: e.target.value || null },
                      })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['solid', 'gradient', 'light'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            branding: { ...formData.branding, background_style: style },
                          })
                        }
                        className={`p-3 rounded-lg border-2 transition capitalize ${
                          formData.branding.background_style === style
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 hover:border-border'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : step === 'consent' ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="space-y-2">
                <h3 className="font-semibold">Consent & Compliance Options</h3>
                <p className="text-sm text-muted-foreground">
                  Configure GDPR compliance and legal requirements
                </p>
              </div>

              <Card className="p-4 space-y-3 border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold">GDPR Consent</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for EU subscribers
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.consent_options.gdpr_enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_options: {
                            ...formData.consent_options,
                            gdpr_enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                {formData.consent_options.gdpr_enabled && (
                  <div className="space-y-2">
                    <Label className="text-xs">Consent Text</Label>
                    <Textarea
                      value={formData.consent_options.gdpr_text}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_options: {
                            ...formData.consent_options,
                            gdpr_text: e.target.value,
                          },
                        })
                      }
                      rows={2}
                    />
                  </div>
                )}
              </Card>

              <Card className="p-4 space-y-3 border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold">Terms & Conditions</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to your terms of service
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.consent_options.terms_enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_options: {
                            ...formData.consent_options,
                            terms_enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                {formData.consent_options.terms_enabled && (
                  <div className="space-y-2">
                    <Label className="text-xs">Terms URL</Label>
                    <Input
                      value={formData.consent_options.terms_url || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_options: {
                            ...formData.consent_options,
                            terms_url: e.target.value || null,
                          },
                        })
                      }
                      placeholder="https://example.com/terms"
                    />
                  </div>
                )}
              </Card>

              <Card className="p-4 space-y-3 border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold">Privacy Policy</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to your privacy policy
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.consent_options.privacy_enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_options: {
                            ...formData.consent_options,
                            privacy_enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                {formData.consent_options.privacy_enabled && (
                  <div className="space-y-2">
                    <Label className="text-xs">Privacy Policy URL</Label>
                    <Input
                      value={formData.consent_options.privacy_url || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_options: {
                            ...formData.consent_options,
                            privacy_url: e.target.value || null,
                          },
                        })
                      }
                      placeholder="https://example.com/privacy"
                    />
                  </div>
                )}
              </Card>

              <Card className="p-4 space-y-3 border-border/60">
                <Label className="font-semibold">Success Message</Label>
                <Textarea
                  value={formData.success_config.message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      success_config: { ...formData.success_config, message: e.target.value },
                    })
                  }
                  rows={2}
                  placeholder="Thank you for subscribing!"
                />
              </Card>

              <Card className="p-4 space-y-3 border-border/60">
                <Label className="font-semibold">Advanced Settings</Label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Double Opt-In</span>
                      <p className="text-xs text-muted-foreground">Require email confirmation</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.settings.double_opt_in}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, double_opt_in: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Send Welcome Email</span>
                      <p className="text-xs text-muted-foreground">Automatically send welcome message</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.settings.send_welcome_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, send_welcome_email: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Allow Duplicates</span>
                      <p className="text-xs text-muted-foreground">Allow same email multiple times</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.settings.allow_duplicates}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: { ...formData.settings, allow_duplicates: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                  </label>
                </div>
              </Card>
            </div>
          ) : step === 'preview' ? (
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h3 className="font-semibold">Form Preview</h3>
                <p className="text-sm text-muted-foreground">
                  This is how your form will appear to subscribers
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <FormPreview formData={formData} />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!showEmbedCode && (
          <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 bg-muted/40">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStepIndex === 0) {
                  onClose()
                } else {
                  setStep(steps[currentStepIndex - 1].id as any)
                }
              }}
            >
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            <div className="flex gap-2">
              {step === 'preview' ? (
                <Button onClick={handleSave} disabled={saving || !formData.name}>
                  {saving ? 'Creating...' : 'Create Form'}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(steps[currentStepIndex + 1].id as any)}
                  disabled={!formData.name && step === 'config'}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FormPreview({ formData }: { formData: SignupFormData }) {
  const bgClass =
    formData.branding.background_style === 'gradient'
      ? 'bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10'
      : formData.branding.background_style === 'light'
      ? 'bg-muted/30'
      : 'bg-white'

  return (
    <Card className={`p-6 space-y-4 border-border/60 ${bgClass}`}>
      {formData.branding.logo_url && (
        <div className="flex justify-center">
          <img
            src={formData.branding.logo_url}
            alt="Logo"
            className="h-12 object-contain"
          />
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(formData.fields).map(([key, field]) => {
          if (!field.enabled) return null
          return (
            <div key={key} className="space-y-1">
              <Label className="text-sm">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input placeholder={field.placeholder} disabled />
            </div>
          )
        })}

        {formData.consent_options.gdpr_enabled && (
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" disabled className="mt-0.5 rounded" />
            <span>{formData.consent_options.gdpr_text}</span>
          </label>
        )}

        <Button
          className="w-full"
          style={{ backgroundColor: formData.branding.primary_color }}
          disabled
        >
          {formData.branding.button_text}
        </Button>

        {(formData.consent_options.privacy_enabled || formData.consent_options.terms_enabled) && (
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            {formData.consent_options.privacy_enabled && <a href="#" className="hover:underline">Privacy Policy</a>}
            {formData.consent_options.privacy_enabled && formData.consent_options.terms_enabled && <span>•</span>}
            {formData.consent_options.terms_enabled && <a href="#" className="hover:underline">Terms & Conditions</a>}
          </div>
        )}
      </div>
    </Card>
  )
}
