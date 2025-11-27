'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Plus, LinkIcon } from 'lucide-react'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    virtual_url: '',
    capacity: '',
    list_id: '',
  })

  useEffect(() => {
    const loadOrgAndEvents = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle()
      if (!profile?.organization_id) return
      setOrgId(profile.organization_id)
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, start_at, end_at, location, virtual_url, capacity, status')
        .eq('organization_id', profile.organization_id)
        .order('start_at', { ascending: true })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      setEvents(data || [])
    }
    loadOrgAndEvents()
  }, [])

  const createEvent = async () => {
    if (!orgId) {
      setError('No organization context')
      return
    }
    if (!form.name.trim() || !form.start_at) {
      setError('Name and start time are required')
      return
    }
    setError(null)
    const { error } = await supabase.from('events').insert({
      organization_id: orgId,
      name: form.name.trim(),
      description: form.description.trim(),
      start_at: form.start_at,
      end_at: form.end_at || null,
      location: form.location,
      virtual_url: form.virtual_url,
      capacity: form.capacity ? Number(form.capacity) : null,
      list_id: form.list_id || null,
      status: 'published',
    })
    if (error) {
      setError(error.message)
      return
    }
    setShowModal(false)
    const { data } = await supabase
      .from('events')
      .select('id, name, description, start_at, end_at, location, virtual_url, capacity, status')
      .eq('organization_id', orgId)
      .order('start_at', { ascending: true })
    setEvents(data || [])
  }

  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Create and publish event signup pages.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New event
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="border-border/60 shadow-soft-lg">
        <CardHeader>
          <CardTitle>Upcoming events</CardTitle>
          <CardDescription>Published and draft events in your org.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && !events.length && <p className="text-sm text-muted-foreground">No events yet.</p>}
            {events.map((ev) => {
              const link = `${baseUrl}/events/${ev.id}`
              return (
                <div key={ev.id} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-3 py-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{ev.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {new Date(ev.start_at).toLocaleString()} • {ev.location || 'Virtual'} • {ev.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/events/builder/${ev.id}`}><Button size="sm" variant="outline">Builder</Button></Link>
                    <Link href={`/events/${ev.id}`} target="_blank"><Button size="sm" variant="outline">View</Button></Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(link)
                      }}
                    >
                      <LinkIcon className="h-4 w-4 mr-1" /> Copy link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const { data, error } = await supabase
                          .from('event_registrations')
                          .select('attendee_name,attendee_email,attendee_company,attendee_role,attendee_phone,status,created_at')
                          .eq('event_id', ev.id)
                          .order('created_at', { ascending: true })
                        if (error) {
                          setError(error.message)
                          return
                        }
                        const header = ['name','email','company','role','phone','status','created_at']
                        const rows = (data || []).map((r: any) => [
                          r.attendee_name || '',
                          r.attendee_email || '',
                          r.attendee_company || '',
                          r.attendee_role || '',
                          r.attendee_phone || '',
                          r.status || '',
                          r.created_at || '',
                        ])
                        const csv = [header, ...rows].map((line) => line.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const urlObj = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = urlObj
                        a.download = `event-${ev.id}-registrations.csv`
                        a.click()
                        URL.revokeObjectURL(urlObj)
                      }}
                    >
                      Export CSV
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Create event</p>
                <h3 className="text-lg font-bold">Event signup page</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Close</Button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End (optional)</Label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Virtual link</Label>
                <Input value={form.virtual_url} onChange={(e) => setForm((p) => ({ ...p, virtual_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={createEvent}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
