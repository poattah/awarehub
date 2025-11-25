'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Search,
  Users,
  ListTree,
  Upload,
  Download,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Bell,
  X,
  Eye,
  Save,
  MoreVertical,
  Trash2,
} from 'lucide-react'

type List = {
  id: string | number
  name: string
  type: 'List' | 'Segment'
  members: number
  created: string
  tags?: string[]
}

type Contact = {
  id: string | number
  name: string
  email: string
  phone: string
  title: string
  location: string
  tags: string[]
  channels: string
}

const lists: List[] = [
  { id: 1, name: 'All Employees', type: 'List', members: 4280, created: '2024-05-12', tags: ['Org-wide'] },
  { id: 2, name: 'Managers & Leads', type: 'Segment', members: 430, created: '2024-06-01', tags: ['People Leaders'] },
  { id: 3, name: 'Remote-Only', type: 'Segment', members: 1190, created: '2024-05-28', tags: ['Remote'] },
  { id: 4, name: 'New Hires (90d)', type: 'Segment', members: 210, created: '2024-07-02', tags: ['Onboarding'] },
  { id: 5, name: 'Safety Champions', type: 'List', members: 85, created: '2024-04-21', tags: ['Safety'] },
]

const contactsByList: Record<number, Contact[]> = {
  1: [
    { id: 1, name: 'Jordan Lee', email: 'jordan.lee@awarehub.com', phone: '+1 (415) 555-0199', title: 'Employee Experience Lead', location: 'San Francisco, CA • PST', tags: ['Managers & Leads', 'Remote'], channels: 'Email + Slack DM' },
    { id: 2, name: 'Priya Desai', email: 'priya.desai@awarehub.com', phone: '+1 (917) 555-1200', title: 'Director, DEI', location: 'New York, NY • EST', tags: ['DEI', 'Org-wide'], channels: 'Email + Teams' },
    { id: 3, name: 'Mateo Alvarez', email: 'mateo.alvarez@awarehub.com', phone: '+44 20 7946 0101', title: 'Security Analyst', location: 'London, UK • GMT', tags: ['Security', 'Remote'], channels: 'Email only' },
  ],
  2: [
    { id: 4, name: 'Sara Chen', email: 'sara.chen@awarehub.com', phone: '+1 (206) 555-4420', title: 'Eng Manager', location: 'Seattle, WA • PST', tags: ['Managers'], channels: 'Email + Slack DM' },
    { id: 5, name: 'Diego Ramos', email: 'diego.ramos@awarehub.com', phone: '+1 (305) 555-0088', title: 'People Lead', location: 'Miami, FL • EST', tags: ['Managers'], channels: 'Email' },
  ],
  3: [
    { id: 6, name: 'Alisha Patel', email: 'alisha.patel@awarehub.com', phone: '+1 (480) 555-2020', title: 'Product Designer', location: 'Remote', tags: ['Remote'], channels: 'Email + Slack DM' },
  ],
  4: [
    { id: 7, name: 'Ethan Brooks', email: 'ethan.brooks@awarehub.com', phone: '+1 (312) 555-7788', title: 'Associate Engineer', location: 'Chicago, IL • CST', tags: ['New Hire'], channels: 'Email' },
  ],
  5: [
    { id: 8, name: 'Kara Mills', email: 'kara.mills@awarehub.com', phone: '+1 (713) 555-8822', title: 'Safety Lead', location: 'Houston, TX • CST', tags: ['Safety'], channels: 'Email + Slack DM' },
  ],
}

export default function RecipientsPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'lists' | 'growth'>('lists')
  const [viewMode, setViewMode] = useState<'lists' | 'contacts'>('lists')
  const [selectedListId, setSelectedListId] = useState<string | number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [previewContact, setPreviewContact] = useState<Contact | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null)
  const [remoteLists, setRemoteLists] = useState<List[]>(lists)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false)
  const menuRefs = useRef<Record<string | number, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string | number, HTMLButtonElement | null>>({})

  const listSource = remoteLists.length ? remoteLists : lists

  const filtered = useMemo(() => {
    if (!query.trim()) return listSource
    return listSource.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
  }, [query, listSource])

  const listActions = [
    'Import data',
    'Edit List Name',
    'List settings',
    'Merge list',
    'Linked integrations',
    'View campaigns',
    'View excluded people',
    'View sign-up forms',
    'Suppress current members',
    'Unsuppress current members',
    'Delete List',
  ]

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!openMenuId) return
      const target = event.target as Node
      const menuEl = menuRefs.current[openMenuId]
      const triggerEl = triggerRefs.current[openMenuId]
      if (menuEl?.contains(target) || triggerEl?.contains(target)) return
      setOpenMenuId(null)
    }

    document.addEventListener('mousedown', handleClickAway)
    return () => document.removeEventListener('mousedown', handleClickAway)
  }, [openMenuId])

  useEffect(() => {
    let active = true
    const fetchLists = async (skipSeed?: boolean) => {
      setListLoading(true)
      setListError(null)

      const { data, error } = await supabase
        .from('recipient_lists')
        .select('id, name, type, tags, member_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!active) return

      if (error) {
        setListError('Supabase fetch failed; showing sample lists.')
        setListLoading(false)
        return
      }

      if (data && data.length) {
        const mapped: List[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          type: (item.type as 'List' | 'Segment') || 'List',
          members: item.member_count ?? 0,
          created: item.created_at?.slice(0, 10) || '',
          tags: item.tags || [],
        }))
        setRemoteLists(mapped)
        setListLoading(false)
        return
      }

      if (!skipSeed && !autoSeedAttempted) {
        const seedRes = await fetch('/api/internal/bootstrap-recipients', { method: 'POST' })
        setAutoSeedAttempted(true)
        if (!seedRes.ok) {
          setListError('No lists found; auto-seed failed. Showing sample lists.')
          setListLoading(false)
          return
        }
        return fetchLists(true)
      }

      setListError('No lists found in Supabase; showing sample lists.')
      setListLoading(false)
    }

    fetchLists()

    return () => {
      active = false
    }
  }, [autoSeedAttempted])

  const fetchContacts = async (listId: string | number) => {
    setContactsLoading(true)
    setContactsError(null)

    const { data, error } = await supabase
      .from('recipient_contact_memberships')
      .select('contact:recipient_contacts(id, full_name, email, phone, title, location, tags, channels)')
      .eq('list_id', listId)
      .limit(50)

    if (error) {
      setContactsError('Supabase fetch failed; showing sample contacts.')
      setContacts(contactsByList[listId as number] || [])
      setContactsLoading(false)
      return
    }

    if (data && data.length) {
      const mapped: Contact[] = data
        .map((row) => row.contact)
        .filter(Boolean)
        .map((c) => ({
          id: c!.id,
          name: c!.full_name,
          email: c!.email,
          phone: c!.phone || '',
          title: c!.title || '',
          location: c!.location || '',
          tags: (c!.tags as string[]) || [],
          channels: Array.isArray(c!.channels) ? c!.channels.join(' + ') : '',
        }))
      setContacts(mapped)
    } else {
      setContactsError('No contacts found; showing sample contacts.')
      setContacts(contactsByList[listId as number] || [])
    }
    setContactsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
          <p className="text-muted-foreground">
            Build lists and smart segments to target awareness campaigns across channels.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New list / segment
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-soft-lg overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
          <button
            onClick={() => setActiveTab('lists')}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              activeTab === 'lists' ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-white text-foreground'
            }`}
          >
            Lists & Segments
          </button>
          <button
            onClick={() => setActiveTab('growth')}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              activeTab === 'growth' ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-white text-foreground'
            }`}
          >
            Growth tools
          </button>
        </div>

        {activeTab === 'lists' && viewMode === 'lists' ? (
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search lists and segments..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">All tags</Button>
                <Button variant="outline" size="sm">All types</Button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-[1.6fr,0.9fr,1fr,1fr,0.9fr] gap-3 text-sm text-muted-foreground font-semibold px-3 py-2">
                <span>Name</span>
                <span>Type</span>
                <span>Members</span>
                <span>Created</span>
                <span className="text-right">Actions</span>
              </div>
              {listError && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  {listError}
                </div>
              )}
              {listLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2">
                  <LoadingSpinner className="h-4 w-4" />
                  Loading lists from Supabase...
                </div>
              )}
              {filtered.map((list) => (
                <div
                  key={list.id}
                  className="grid grid-cols-[1.6fr,0.9fr,1fr,1fr,0.9fr] gap-3 items-center rounded-xl border border-border/60 bg-card px-3 py-3 shadow-soft hover:border-primary/60 hover:bg-primary/5 transition relative"
                >
                  <div className="flex items-center gap-2">
                    {list.type === 'List' ? (
                      <ListTree className="h-4 w-4 text-primary" />
                    ) : (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                    <div className="flex flex-col">
                      <button
                        className="text-left font-semibold text-primary hover:underline"
                        onClick={() => {
                          setSelectedListId(list.id)
                          fetchContacts(list.id)
                          setViewMode('contacts')
                        }}
                      >
                        {list.name}
                      </button>
                      <div className="flex flex-wrap gap-1">
                        {(list.tags || []).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[11px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{list.type}</span>
                  <span className="text-sm text-muted-foreground">{list.members.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{list.created}</span>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedListId(list.id)
                        fetchContacts(list.id)
                        setViewMode('contacts')
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      ref={(el) => {
                        if (el) triggerRefs.current[list.id] = el
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === list.id ? null : list.id)
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {openMenuId === list.id && (
                      <div
                        role="menu"
                        className="absolute right-3 top-12 z-20 w-56 rounded-xl border border-border/70 bg-white shadow-soft-lg p-1"
                        ref={(el) => {
                          if (el) menuRefs.current[list.id] = el
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {listActions.map((action) => (
                          <button
                            key={action}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                              action === 'Delete List' ? 'text-red-600 hover:text-red-700' : 'text-foreground'
                            }`}
                            onClick={() => setOpenMenuId(null)}
                          >
                            <span className="flex items-center gap-2">
                              {action === 'Delete List' ? <Trash2 className="h-4 w-4" /> : null}
                              {action}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'lists' && viewMode === 'contacts' ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="cursor-pointer hover:text-foreground" onClick={() => setViewMode('lists')}>Recipients</span>
              <span>/</span>
              <span className="cursor-pointer hover:text-foreground" onClick={() => setViewMode('lists')}>Lists</span>
              <span>/</span>
              <span className="text-foreground font-semibold">{listSource.find((l) => l.id === selectedListId)?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Contacts in {listSource.find((l) => l.id === selectedListId)?.name}</p>
                <p className="text-xs text-muted-foreground">Drill down, edit inline, or preview a contact.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode('lists')}>Back to lists</Button>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add contact
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-[1.6fr,1.8fr,1.3fr,1fr,0.9fr] gap-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              <span>Name</span>
              <span>Email</span>
              <span>Title</span>
              <span>Location</span>
              <span>Actions</span>
            </div>
            {contactsError && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                {contactsError}
              </div>
            )}
            {contactsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoadingSpinner className="h-4 w-4" />
                Loading contacts...
              </div>
            )}
            {(contacts || []).map((contact, idx) => (
              <div
                key={contact.id}
                className="grid grid-cols-[1.6fr,1.8fr,1.3fr,1fr,0.9fr] gap-3 items-center rounded-xl border border-border/60 bg-card px-3 py-3 shadow-soft"
              >
                <Input
                  value={contact.name}
                  onChange={(e) => {
                    const next = [...contacts]
                    next[idx] = { ...next[idx], name: e.target.value }
                    setContacts(next)
                  }}
                  className="h-9"
                />
                <Input
                  value={contact.email}
                  onChange={(e) => {
                    const next = [...contacts]
                    next[idx] = { ...next[idx], email: e.target.value }
                    setContacts(next)
                  }}
                  className="h-9"
                />
                <Input
                  value={contact.title}
                  onChange={(e) => {
                    const next = [...contacts]
                    next[idx] = { ...next[idx], title: e.target.value }
                    setContacts(next)
                  }}
                  className="h-9"
                />
                <Input
                  value={contact.location}
                  onChange={(e) => {
                    const next = [...contacts]
                    next[idx] = { ...next[idx], location: e.target.value }
                    setContacts(next)
                  }}
                  className="h-9"
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPreviewContact(contact)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <GrowthCard
                title="Create signup form"
                description="Capture new subscribers with branded forms and consent."
                cta="Create"
              />
              <GrowthCard
                title="Preference pages"
                description="Let people tailor topics: wellbeing, DEI, safety, compliance."
                cta="Customize"
              />
              <GrowthCard
                title="Import directory"
                description="Sync HRIS or CSV to keep lists fresh."
                cta="Connect"
              />
              <GrowthCard
                title="Invite champions"
                description="Add campaign champions as reviewers before launch."
                cta="Add champions"
              />
            </div>
          </div>
        )}
      </div>

      <Card className="border-border/60 shadow-soft-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
          <div>
            <p className="text-sm font-semibold">Sync & export</p>
            <p className="text-xs text-muted-foreground">Keep recipients aligned across tools.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Link href="/integrations">
              <Button size="sm">
                <ArrowRight className="mr-2 h-4 w-4" />
                Connect source
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Need HRIS sync (Workday, BambooHR, Okta, etc.)? Connect via Integrations to auto-update lists and segments.
        </div>
      </Card>

      {previewContact && <RecipientPreview contact={previewContact} onClose={() => setPreviewContact(null)} />}
    </div>
  )
}

function GrowthCard({ title, description, cta }: { title: string; description: string; cta: string }) {
  return (
    <Card className="border-border/60 shadow-soft-lg p-4 space-y-2">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm">{cta}</Button>
    </Card>
  )
}

function RecipientPreview({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-card shadow-soft-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Recipient preview</p>
            <h3 className="text-lg font-bold">{contact.name}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <div>
              <p className="font-semibold">{contact.title}</p>
              <p className="text-muted-foreground">{contact.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{contact.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{contact.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{contact.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Subscribed: {contact.channels}</span>
          </div>
          <Card className="mt-2 border-border/60 bg-muted/40">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Recent campaign</p>
                <p className="text-sm font-semibold">Psychological Safety Month</p>
                <p className="text-xs text-muted-foreground">Opened email • Reacted in Slack</p>
              </div>
              <Button variant="outline" size="sm">View profile</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
