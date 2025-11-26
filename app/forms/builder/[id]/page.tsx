'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Copy, Plus, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

type FieldDef = {
  key: string
  label: string
  type: 'email' | 'text' | 'tel' | 'date' | 'select' | 'address'
  enabled: boolean
  required: boolean
  options?: string[]
  children?: FieldDef[]
}

type FormRecord = {
  id: string
  name: string
  description?: string | null
  fields?: FieldDef[]
  settings?: Record<string, any>
}

const palette: FieldDef[] = [
  { key: 'email', label: 'Email', type: 'email', enabled: true, required: true },
  { key: 'first_name', label: 'First name', type: 'text', enabled: true, required: false },
  { key: 'last_name', label: 'Last name', type: 'text', enabled: true, required: false },
  { key: 'phone', label: 'Phone', type: 'tel', enabled: true, required: false },
  { key: 'country', label: 'Country', type: 'text', enabled: true, required: false },
  { key: 'date_of_birth', label: 'Date of birth', type: 'date', enabled: true, required: false },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male','female','non-binary','prefer_not_to_say','other'], enabled: true, required: false },
  {
    key: 'address',
    label: 'Address',
    type: 'address',
    enabled: true,
    required: false,
    children: [
      { key: 'street_address', label: 'Street address', type: 'text', enabled: true, required: false },
      { key: 'apartment', label: 'Apartment', type: 'text', enabled: false, required: false },
      { key: 'city', label: 'City', type: 'text', enabled: true, required: false },
      { key: 'state', label: 'State', type: 'text', enabled: true, required: false },
      { key: 'postal_code', label: 'Postal code', type: 'text', enabled: true, required: false },
    ],
  },
  { key: 'job_title', label: 'Job title', type: 'text', enabled: true, required: false },
  { key: 'company_name', label: 'Company name', type: 'text', enabled: true, required: false },
  { key: 'industry', label: 'Industry', type: 'text', enabled: true, required: false },
  { key: 'team_size', label: 'Team size', type: 'text', enabled: true, required: false },
  { key: 'work_phone', label: 'Work phone', type: 'tel', enabled: true, required: false },
]

export default function FormBuilderPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [form, setForm] = useState<FormRecord | null>(null)
  const [fields, setFields] = useState<FieldDef[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [settings, setSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('signup_forms')
        .select('id, name, description, fields, settings')
        .eq('id', id)
        .maybeSingle()
      if (error || !data) {
        setError(error?.message || 'Form not found')
      } else {
        const fieldArray = Array.isArray(data.fields) ? (data.fields as FieldDef[]) : []
        setForm(data as FormRecord)
        setSettings((data as any).settings || {})
        setFields(fieldArray.length ? fieldArray : [palette[0]]) // ensure email exists
      }
      setLoading(false)
    }
    load()
  }, [id])

  const ensureEmailFirst = (list: FieldDef[]) => {
    const email = list.find((f) => f.key === 'email')
    const rest = list.filter((f) => f.key !== 'email')
    return email ? [email, ...rest] : [palette[0], ...rest]
  }

  const addField = (template: FieldDef) => {
    // prevent duplicate email
    if (template.key === 'email' && fields.some((f) => f.key === 'email')) return
    setFields((prev) => [...prev, { ...template }])
  }

  const moveField = (idx: number, dir: -1 | 1) => {
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === fields.length - 1)) return
    setFields((prev) => {
      const next = [...prev]
      const [removed] = next.splice(idx, 1)
      next.splice(idx + dir, 0, removed)
      return ensureEmailFirst(next)
    })
  }

  const handleDragStart = (idx: number) => {
    setDragIndex(idx)
  }

  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return
    setFields((prev) => {
      const next = [...prev]
      const [removed] = next.splice(dragIndex, 1)
      next.splice(idx, 0, removed)
      return ensureEmailFirst(next)
    })
    setDragIndex(null)
  }

  const removeField = (idx: number) => {
    if (fields[idx].key === 'email') return
    setFields((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    setStatus('Saving...')
    setError(null)
    const payload = ensureEmailFirst(fields)
    const { error } = await supabase
      .from('signup_forms')
      .update({ fields: payload, settings })
      .eq('id', id)
    setSaving(false)
    if (error) {
      setError(error.message)
      setStatus(null)
    } else {
      setStatus('Saved')
      setTimeout(() => setStatus(null), 1500)
    }
  }

  const previewFields = useMemo(() => ensureEmailFirst(fields).filter((f) => f.enabled), [fields])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading builder…</div>
  }
  if (error || !form) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Form not found'}</div>
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b border-border/60 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Signup form builder</p>
            <h1 className="text-lg font-bold">{form.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && <Badge variant="outline">{status}</Badge>}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px,1.4fr,1fr] px-4 py-4">
        {/* Palette */}
        <Card className="border-border/60 p-3 space-y-3 shadow-soft-lg">
          <div>
            <p className="text-sm font-semibold">Blocks</p>
            <p className="text-xs text-muted-foreground">Click to add fields</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {palette.map((block) => (
              <button
                key={block.key}
                className="rounded-lg border border-border/60 bg-white p-2 text-left hover:border-primary/60"
                onClick={() => addField(block)}
              >
                <p className="text-sm font-semibold">{block.label}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{block.type}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Canvas */}
        <Card className="border-border/60 p-4 shadow-soft-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">Form layout</p>
              <p className="text-xs text-muted-foreground">Drag to reorder, toggle visibility and required.</p>
            </div>
            <Badge variant="outline">{fields.length} fields</Badge>
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div
                key={`${field.key}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-3 shadow-sm"
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">⋮⋮</div>
                  <div>
                    <p className="text-sm font-semibold">{field.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
                    {field.type === 'select' && field.options && (
                      <p className="text-[11px] text-muted-foreground">Options: {field.options.join(', ')}</p>
                    )}
                    {field.type === 'address' && <p className="text-[11px] text-muted-foreground">Address group</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={(e) =>
                        setFields((prev) => {
                          const next = [...prev]
                          next[idx] = { ...field, enabled: e.target.checked }
                          return next
                        })
                      }
                      className="h-4 w-4"
                    />
                    Enabled
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={!field.enabled || field.key === 'email'}
                      onChange={(e) =>
                        setFields((prev) => {
                          const next = [...prev]
                          next[idx] = { ...field, required: e.target.checked }
                          return next
                        })
                      }
                      className="h-4 w-4"
                    />
                    Required
                  </label>
                  {field.key !== 'email' && (
                    <Button variant="ghost" size="icon" onClick={() => removeField(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Preview / settings */}
        <div className="space-y-3">
          <Card className="border-border/60 p-3 shadow-soft-lg">
            <p className="text-sm font-semibold mb-2">Branding</p>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Logo URL</label>
                <Input
                  value={settings.logo_url || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Banner image URL</label>
                <Input
                  value={settings.banner_url || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, banner_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Page background</label>
                  <Input
                    type="color"
                    value={settings.bg_color || '#f5f5f5'}
                    onChange={(e) => setSettings((prev) => ({ ...prev, bg_color: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Form background</label>
                  <Input
                    type="color"
                    value={settings.form_bg_color || '#ffffff'}
                    onChange={(e) => setSettings((prev) => ({ ...prev, form_bg_color: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Button color</label>
                  <Input
                    type="color"
                    value={settings.button_bg_color || '#2563eb'}
                    onChange={(e) => setSettings((prev) => ({ ...prev, button_bg_color: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Button text</label>
                  <Input
                    type="color"
                    value={settings.button_text_color || '#ffffff'}
                    onChange={(e) => setSettings((prev) => ({ ...prev, button_text_color: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card className="border-border/60 p-4 shadow-soft-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Preview</p>
                <p className="text-xs text-muted-foreground">Based on current layout</p>
              </div>
              <Link href={`/forms/${id}`} target="_blank">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Open form
                </Button>
              </Link>
            </div>
            <div className="mt-3 space-y-3 max-h-[80vh] overflow-y-auto">
              {settings.banner_url && (
                <div className="w-full rounded-lg overflow-hidden border border-border/60">
                  <div
                    className="h-28 bg-cover bg-center"
                    style={{ backgroundImage: `url(${settings.banner_url})` }}
                  />
                </div>
              )}
              {settings.logo_url && (
                <div className="flex justify-center">
                  <img src={settings.logo_url} alt="logo" className="h-12 object-contain" />
                </div>
              )}
              {previewFields.map((field) => {
                if (field.type === 'select') {
                  return (
                    <div key={field.key} className="space-y-1">
                      <p className="text-sm font-semibold">
                        {field.label}{field.required ? ' *' : ''}
                      </p>
                      <div className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-muted-foreground">
                        {(field.options || []).join(', ') || 'Select options'}
                      </div>
                    </div>
                  )
                }
                if (field.type === 'address') {
                  return (
                    <div key={field.key} className="space-y-1">
                      <p className="text-sm font-semibold">{field.label}{field.required ? ' *' : ''}</p>
                      <div className="space-y-2">
                        {(field.children || []).filter((c) => c.enabled).map((child) => (
                          <div key={child.key} className="text-xs text-muted-foreground">
                            {child.label}{child.required ? ' *' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={field.key} className="space-y-1">
                    <p className="text-sm font-semibold">
                      {field.label}{field.required ? ' *' : ''}
                    </p>
                    <div className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-muted-foreground">
                      {field.type === 'date' ? 'Date picker' : 'Input'}
                    </div>
                  </div>
                )
              })}
              {!previewFields.length && (
                <p className="text-xs text-muted-foreground">Enable fields to see preview.</p>
              )}
            </div>
          </Card>
          <Card className="border-border/60 p-3 shadow-soft-lg">
            <p className="text-sm font-semibold mb-2">Tips</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Email stays first and required.</li>
              <li>Use drag (or arrows) to reorder fields.</li>
              <li>Toggle enabled/required to control visibility and validation.</li>
              <li>Open the form link to test end-user experience.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
