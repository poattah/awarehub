'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { loadAndApplyBrandForOrg } from '@/lib/brand'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function PublicEventPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [values, setValues] = useState({
    attendee_name: '',
    attendee_email: '',
    attendee_company: '',
    attendee_role: '',
    attendee_phone: '',
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, start_at, end_at, location, virtual_url, capacity, list_id, organization_id, settings')
        .eq('id', id)
        .maybeSingle()
      if (error || !data) {
        setError('Event not found')
        setLoading(false)
        return
      }
      setEvent(data)
      if ((data as any).organization_id) {
        loadAndApplyBrandForOrg((data as any).organization_id as string)
        const theme = ((data as any).settings?.theme || {}) as any
        if (typeof document !== 'undefined' && theme) {
          const root = document.documentElement
          const setVar = (k: string, v: string) => root.style.setProperty(k, v)
          if (theme.primary) setVar('--brand-primary', theme.primary)
          if (theme.background) setVar('--brand-bg', theme.background)
          if (theme.text) setVar('--brand-text', theme.text)
          if (theme.buttonBg) setVar('--brand-button-bg', theme.buttonBg)
          if (theme.buttonText) setVar('--brand-button-text', theme.buttonText)
          if (theme.headingFont) setVar('--brand-font-heading', theme.headingFont)
          if (theme.bodyFont) setVar('--brand-font-body', theme.bodyFont)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  const isPast = useMemo(() => {
    if (!event?.start_at) return false
    return new Date(event.start_at) < new Date()
  }, [event?.start_at])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    if (!values.attendee_name.trim() || !values.attendee_email.trim()) {
      setStatusMsg('Name and email are required')
      return
    }
    setStatusMsg('Submitting...')

    let regStatus: 'registered' | 'waitlisted' = 'registered'
    if (event.capacity) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'registered')
      if (typeof count === 'number' && count >= event.capacity) {
        regStatus = 'waitlisted'
      }
    }

    const payload = {
      event_id: event.id,
      organization_id: event.organization_id,
      list_id: event.list_id,
      attendee_name: values.attendee_name.trim(),
      attendee_email: values.attendee_email.trim(),
      attendee_company: values.attendee_company.trim(),
      attendee_role: values.attendee_role.trim(),
      attendee_phone: values.attendee_phone.trim(),
      status: regStatus,
      source: 'public_page',
      metadata: { notes: values.notes },
    }

    const { error } = await supabase.from('event_registrations').insert(payload)
    if (error) {
      setStatusMsg(error.message || 'Failed to register')
      return
    }

    // Add to list if provided
    if (event.list_id) {
      const { data: existing } = await supabase
        .from('recipient_contacts')
        .select('id')
        .eq('organization_id', event.organization_id)
        .eq('email', values.attendee_email.trim())
        .maybeSingle()
      let contactId = existing?.id
      if (!contactId) {
        const { data: inserted } = await supabase
          .from('recipient_contacts')
          .insert({
            organization_id: event.organization_id,
            full_name: values.attendee_name.trim(),
            email: values.attendee_email.trim(),
            title: values.attendee_role.trim(),
            phone: values.attendee_phone.trim(),
            location: event.location || '',
          })
          .select('id')
          .maybeSingle()
        contactId = inserted?.id
      }
      if (contactId) {
        await supabase.from('recipient_contact_memberships').insert({
          list_id: event.list_id,
          contact_id: contactId,
        })
      }
    }

    setStatusMsg(regStatus === 'waitlisted' ? 'Added to waitlist.' : 'Registered!')
    setValues({ attendee_name: '', attendee_email: '', attendee_company: '', attendee_role: '', attendee_phone: '', notes: '' })
  }

  if (loading) return <div className="p-6">Loading event…</div>
  if (error || !event) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-[var(--brand-bg,#f8fafc)]" style={{ color: 'var(--brand-text,#0f172a)' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Event</p>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--brand-font-heading,inherit)' }}>{event.name}</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--brand-font-body,inherit)' }}>{event.description}</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{new Date(event.start_at).toLocaleString()} {event.location ? `• ${event.location}` : ''}</p>
            {event.virtual_url && <p>Virtual: <a className="underline" href={event.virtual_url} target="_blank" rel="noreferrer">{event.virtual_url}</a></p>}
            {event.capacity ? <p>Capacity: {event.capacity}</p> : null}
            {isPast && <p className="text-red-600">This event has passed.</p>}
          </div>
        </div>

        {!isPast && (
          <Card className="border-border/60 shadow-soft-lg bg-card/90">
            <form className="space-y-3 p-4" onSubmit={submit}>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={values.attendee_name} onChange={(e) => setValues((p) => ({ ...p, attendee_name: e.target.value }))} required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={values.attendee_email} onChange={(e) => setValues((p) => ({ ...p, attendee_email: e.target.value }))} required />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={values.attendee_company} onChange={(e) => setValues((p) => ({ ...p, attendee_company: e.target.value }))} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={values.attendee_role} onChange={(e) => setValues((p) => ({ ...p, attendee_role: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={values.attendee_phone} onChange={(e) => setValues((p) => ({ ...p, attendee_phone: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Anything else" value={values.notes} onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              {statusMsg && <p className="text-xs text-muted-foreground">{statusMsg}</p>}
              <div className="flex justify-end gap-2">
                <Button type="submit">{event.capacity ? 'RSVP' : 'Sign up'}</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</p>
}
