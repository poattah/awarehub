'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function EventBuilderPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [themePrimary, setThemePrimary] = useState('#3b82f6')
  const [themeBg, setThemeBg] = useState('#ffffff')
  const [themeText, setThemeText] = useState('#0f172a')
  const [themeButtonBg, setThemeButtonBg] = useState('#3b82f6')
  const [themeButtonText, setThemeButtonText] = useState('#ffffff')
  const [themeHeadingFont, setThemeHeadingFont] = useState('Inter')
  const [themeBodyFont, setThemeBodyFont] = useState('Inter')
  const [notifySubject, setNotifySubject] = useState('')
  const [notifySendAt, setNotifySendAt] = useState('')
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null)
  const defaultRegFields = ['attendee_name','attendee_email','attendee_company','attendee_role','attendee_phone','notes']
  const [regFields, setRegFields] = useState<string[]>(defaultRegFields)

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        setError('Not signed in')
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle()
      const orgIdFromProfile = (profile as any)?.organization_id as string | null
      if (!orgIdFromProfile) {
        setError('No organization context')
        setLoading(false)
        return
      }
      setOrgId(orgIdFromProfile)
      setUserId(userId)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgIdFromProfile)
        .maybeSingle()
      if (error || !data) {
        setError('Event not found')
        setLoading(false)
        return
      }
      setEvent({ ...(data as any) })
      setNotifySubject(`Invite: ${(data as any).name || 'Event'}`)
      const theme = ((data as any).settings?.theme || {}) as any
      if (theme.primary) setThemePrimary(theme.primary)
      if (theme.background) setThemeBg(theme.background)
      if (theme.text) setThemeText(theme.text)
      if (theme.buttonBg) setThemeButtonBg(theme.buttonBg)
      if (theme.buttonText) setThemeButtonText(theme.buttonText)
      if (theme.headingFont) setThemeHeadingFont(theme.headingFont)
      if (theme.bodyFont) setThemeBodyFont(theme.bodyFont)
      const reg = ((data as any).settings?.registration_fields || []) as string[]
      if (reg && reg.length) setRegFields(reg)
      setLoading(false)
    }
    load()
  }, [id])

  const updateField = (key: string, value: any) => {
    setEvent((prev: any) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    if (!event || !orgId) return false
    if (!event.name?.trim() || !event.start_at) {
      setError('Name and start time are required')
      return false
    }
    setSaving(true)
    setError(null)
    const nextSettings = {
      ...(event.settings || {}),
      theme: {
        primary: themePrimary,
        background: themeBg,
        text: themeText,
        buttonBg: themeButtonBg,
        buttonText: themeButtonText,
        headingFont: themeHeadingFont,
        bodyFont: themeBodyFont,
      },
      registration_fields: regFields,
    }
    const { error } = await (supabase as any)
      .from('events')
      .update({
        name: event.name.trim(),
        description: event.description?.trim() || null,
        start_at: event.start_at,
        end_at: event.end_at || null,
        location: event.location || null,
        virtual_url: event.virtual_url || null,
        capacity: event.capacity || null,
        list_id: event.list_id || null,
        status: event.status || 'draft',
        brand_kit_id: event.brand_kit_id || null,
        cover_url: event.cover_url || null,
        settings: nextSettings,
      })
      .eq('id', id)
      .eq('organization_id', orgId)
    setSaving(false)
    if (error) {
      setError(error.message || 'Failed to save event')
      return false
    }
    // Refetch to ensure preview shows latest content (e.g., description)
    const { data: refreshed } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (refreshed) setEvent({ ...(refreshed as any) })
    setStatusMsg('Saved')
    setTimeout(() => setStatusMsg(null), 1200)
    return true
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event builder</h1>
          <p className="text-muted-foreground">Edit and publish your event signup page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push('/events')}>Back</Button>
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await save()
              if (ok) window.open(`/events/${id}?t=${Date.now()}`, '_blank')
            }}
          >
            Preview
          </Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
      {statusMsg && <p className="text-sm text-green-600">{statusMsg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Core details about your event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={event.name || ''} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={3} value={event.description || ''} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input type="datetime-local" value={event.start_at || ''} onChange={(e) => updateField('start_at', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input type="datetime-local" value={event.end_at || ''} onChange={(e) => updateField('end_at', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={event.location || ''} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Virtual link</Label>
              <Input value={event.virtual_url || ''} onChange={(e) => updateField('virtual_url', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" value={event.capacity || ''} onChange={(e) => updateField('capacity', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Branding & Targeting</CardTitle>
            <CardDescription>Apply brand and route registrations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Cover image URL</Label>
              <Input value={event.cover_url || ''} onChange={(e) => updateField('cover_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={event.status || 'draft'}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Primary color</Label>
                <Input type="color" value={themePrimary} onChange={(e) => setThemePrimary(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Background color</Label>
                <Input type="color" value={themeBg} onChange={(e) => setThemeBg(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Text color</Label>
                <Input type="color" value={themeText} onChange={(e) => setThemeText(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Button BG</Label>
                <Input type="color" value={themeButtonBg} onChange={(e) => setThemeButtonBg(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Button text</Label>
                <Input type="color" value={themeButtonText} onChange={(e) => setThemeButtonText(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Heading font</Label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  value={themeHeadingFont}
                  onChange={(e) => setThemeHeadingFont(e.target.value)}
                >
                  {['Inter','Manrope','Space Grotesk','Poppins','Open Sans'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Body font</Label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  value={themeBodyFont}
                  onChange={(e) => setThemeBodyFont(e.target.value)}
                >
                  {['Inter','Manrope','Space Grotesk','Poppins','Open Sans'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-semibold">Theme preview</p>
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full border" style={{ background: themePrimary }} />
                <span className="h-8 w-8 rounded-full border" style={{ background: themeBg }} />
                <span className="h-8 w-8 rounded-full border" style={{ background: themeText }} />
              </div>
              <div className="flex gap-2 mt-2">
                <Button style={{ background: themeButtonBg, color: themeButtonText }}>Primary</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle>Notify list</CardTitle>
            <CardDescription>Create a draft email campaign to invite the target list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input value={notifySubject} onChange={(e) => setNotifySubject(e.target.value)} placeholder="Invite: Event name" />
              </div>
              <div className="space-y-1">
                <Label>Send time (optional)</Label>
                <Input type="datetime-local" value={notifySendAt} onChange={(e) => setNotifySendAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave blank to keep as draft and send later.</p>
              </div>
            </div>
            {notifyStatus && <p className="text-xs text-muted-foreground">{notifyStatus}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!event?.list_id) {
                    setNotifyStatus('Add a target list to this event first.')
                    return
                  }
                  if (!orgId || !userId) {
                    setNotifyStatus('No organization context; please sign in again.')
                    return
                  }
                  const baseUrl =
                    typeof window !== 'undefined'
                      ? window.location.origin
                      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                  const eventLink = `${baseUrl}/events/${event.id}`
                  setNotifyStatus('Creating draft campaign...')
                  const { error } = await (supabase as any).from('campaigns').insert({
                    organization_id: orgId,
                    created_by: userId,
                    name: notifySubject || `Invite: ${event.name}`,
                    description: event.description || '',
                    status: 'draft',
                    start_at: notifySendAt || null,
                    primary_category: 'Other',
                    tags: ['event'],
                    metadata: {
                      type: 'event_notify',
                      event_id: event.id,
                      event_link: eventLink,
                      list_id: event.list_id,
                      location: event.location,
                      start_at: event.start_at,
                      virtual_url: event.virtual_url,
                    },
                  })
                  if (error) {
                    setNotifyStatus(error.message || 'Failed to create draft campaign')
                    return
                  }
                  setNotifyStatus('Draft campaign created. Review and send from Campaigns.')
                  setTimeout(() => setNotifyStatus(null), 1500)
                }}
              >
                Create draft campaign
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle>Registration fields</CardTitle>
            <CardDescription>Choose which fields appear on the RSVP form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {regFields.map((field, idx) => (
              <div key={field} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium capitalize">{field.replace('attendee_','').replace('_',' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (idx === 0) return
                      setRegFields((prev) => {
                        const next = [...prev]
                        ;[next[idx-1], next[idx]] = [next[idx], next[idx-1]]
                        return next
                      })
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (idx === regFields.length - 1) return
                      setRegFields((prev) => {
                        const next = [...prev]
                        ;[next[idx+1], next[idx]] = [next[idx], next[idx+1]]
                        return next
                      })
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRegFields((prev) => prev.filter((f) => f !== field))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {defaultRegFields.filter((f) => !regFields.includes(f)).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-muted-foreground">Add field:</span>
                {defaultRegFields.filter((f) => !regFields.includes(f)).map((f) => (
                  <Button key={f} size="sm" variant="outline" onClick={() => setRegFields((prev) => [...prev, f])}>
                    {f.replace('attendee_','').replace('_',' ')}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
