'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  metadata?: Record<string, string>
}

const waitlistTemplates = {
  glow: {
    name: 'Gradient glow',
    description: 'Dark hero with gradients and pill inputs',
    settings: {
      theme: 'waitlist_glow',
      background: {
        mode: 'gradient',
        from: '#0b1224',
        to: '#0a0f1a',
        accents: ['rgba(99,102,241,0.3)', 'rgba(236,72,153,0.25)'],
      },
      input_style: 'pill',
      button_style: 'gradient',
      vignette: true,
    },
  },
  light: {
    name: 'Light airy',
    description: 'Soft white card with subtle shadow',
    settings: {
      theme: 'waitlist_light',
      background: {
        mode: 'solid',
        color: '#f8fafc',
      },
      input_style: 'rounded',
      button_style: 'solid',
      vignette: false,
    },
  },
  mono: {
    name: 'Monochrome',
    description: 'High-contrast black/white with grid texture',
    settings: {
      theme: 'waitlist_mono',
      background: {
        mode: 'texture',
        color: '#0f172a',
        noise: 0.2,
      },
      input_style: 'pill',
      button_style: 'outline',
      vignette: true,
    },
  },
  photo: {
    name: 'Photo overlay',
    description: 'Hero photo with blur/dim overlay',
    settings: {
      theme: 'waitlist_photo',
      background: {
        mode: 'photo',
        dim: 0.5,
      },
      input_style: 'pill',
      button_style: 'solid',
      vignette: true,
    },
  },
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isGrowthOnly = pathname?.startsWith('/growth')
  const defaultTab = isGrowthOnly || searchParams.get('tab') === 'growth' ? 'growth' : 'lists'
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'lists' | 'growth'>(defaultTab)
  const [viewMode, setViewMode] = useState<'lists' | 'contacts'>('lists')
  const [selectedListId, setSelectedListId] = useState<string | number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [previewContact, setPreviewContact] = useState<Contact | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null)
  const [contactMenuId, setContactMenuId] = useState<string | number | null>(null)
  const [contactSort, setContactSort] = useState<{ key: 'name' | 'email' | 'title' | 'location'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' })
  const [remoteLists, setRemoteLists] = useState<List[]>(lists)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListType, setNewListType] = useState<'List' | 'Segment'>('List')
  const [newListTags, setNewListTags] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importTargetList, setImportTargetList] = useState<string | number | ''>('')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [lottieReady, setLottieReady] = useState(false)
  const [savingList, setSavingList] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [newContact, setNewContact] = useState<Omit<Contact, 'id' | 'channels'>>({
    name: '',
    email: '',
    phone: '',
    title: '',
    location: '',
    tags: [],
    metadata: {},
  })
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }])
  const menuRefs = useRef<Record<string | number, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string | number, HTMLButtonElement | null>>({})
  const [signupForms, setSignupForms] = useState<any[]>([])
  const [waitlistForms, setWaitlistForms] = useState<any[]>([])
  const [openFormMenuId, setOpenFormMenuId] = useState<string | null>(null)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [signupName, setSignupName] = useState('')
  const [signupDescription, setSignupDescription] = useState('')
  const [signupTargetList, setSignupTargetList] = useState<string>('')
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('Thanks for signing up!')
  const [signupAllowDuplicates, setSignupAllowDuplicates] = useState(false)
  const [signupConsentText, setSignupConsentText] = useState('I agree to receive updates from this organization.')
  const [signupStatus, setSignupStatus] = useState<string | null>(null)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [orgLoading, setOrgLoading] = useState(true)
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistDescription, setWaitlistDescription] = useState('')
  const [waitlistTargetList, setWaitlistTargetList] = useState<string>('')
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)
  const [waitlistPreset, setWaitlistPreset] = useState<'glow' | 'light' | 'mono' | 'photo'>('glow')
  const [waitlistHeadline, setWaitlistHeadline] = useState('Join the waitlist')
  const [waitlistSubhead, setWaitlistSubhead] = useState('Be the first to know when we launch.')
  const [waitlistCtaLabel, setWaitlistCtaLabel] = useState('Join waitlist')
  const [savingContactId, setSavingContactId] = useState<string | number | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<string | number | null>(null)
  const [showEditContactModal, setShowEditContactModal] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editChannels, setEditChannels] = useState('')
  const baseSignupFields = [
    { key: 'email', label: 'Email', type: 'email', enabled: true, required: true },
  ]

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
    const loadOrg = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        setOrgLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle()
      if (data?.organization_id) {
        setCurrentOrgId(data.organization_id as string)
      }
      setOrgLoading(false)
    }
    loadOrg()
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.getElementById('dotlottie-wc-loader')) {
      setLottieReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'dotlottie-wc-loader'
    script.type = 'module'
    script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.5/dist/dotlottie-wc.js'
    script.onload = () => setLottieReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (isGrowthOnly) {
      setActiveTab('growth')
    }
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node
      if (openMenuId) {
        const menuEl = menuRefs.current[openMenuId]
        const triggerEl = triggerRefs.current[openMenuId]
        if (!(menuEl?.contains(target) || triggerEl?.contains(target))) {
          setOpenMenuId(null)
        }
      }
      if (contactMenuId) {
        setContactMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickAway)
    return () => document.removeEventListener('mousedown', handleClickAway)
  }, [openMenuId])

  const fetchLists = useCallback(
    async (skipSeed?: boolean) => {
      setListLoading(true)
      setListError(null)

      const { data, error } = await supabase
        .from('recipient_lists')
        .select('id, name, type, tags, member_count, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

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
    },
    [autoSeedAttempted]
  )

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  useEffect(() => {
    if (activeTab !== 'growth') return
    const loadSignupForms = async () => {
      setSignupLoading(true)
      setSignupError(null)
      const { data, error } = await supabase
        .from('signup_forms')
        .select('id, name, description, target_list_id, success_config, created_at, fields, kind')
        .order('created_at', { ascending: false })
        .limit(25)
      if (error) {
        setSignupError('Could not load signup forms')
      } else {
        const forms = data || []
        setSignupForms(forms.filter((f) => (f as any).kind !== 'waitlist'))
        setWaitlistForms(forms.filter((f) => (f as any).kind === 'waitlist'))
      }
      setSignupLoading(false)
    }
    loadSignupForms()
  }, [activeTab])

  const fetchContacts = async (listId: string | number) => {
    setContactsLoading(true)
    setContactsError(null)

    const { data, error } = await supabase
      .from('recipient_contact_memberships')
      .select('contact:recipient_contacts(id, full_name, email, phone, title, location, tags, channels, metadata)')
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
        .map((c) => {
          const meta = (c as any)?.metadata || {}
          const displayName = [meta.first_name, meta.last_name].filter(Boolean).join(' ') || c!.full_name || c!.email
          return {
            id: c!.id,
            name: displayName,
            email: c!.email,
            phone: c!.phone || '',
            title: c!.title || '',
            location: c!.location || '',
            tags: (c!.tags as string[]) || [],
            channels: Array.isArray(c!.channels) ? c!.channels.join(' + ') : '',
            metadata: meta,
          }
        })
      setContacts(mapped)
    } else {
      setContactsError('No contacts found; showing sample contacts.')
      setContacts(contactsByList[listId as number] || [])
    }
    setContactsLoading(false)
  }

  const refreshListCount = async (listId: string | number) => {
    const { count } = await supabase
      .from('recipient_contact_memberships')
      .select('contact_id', { count: 'exact', head: true })
      .eq('list_id', listId)

    if (typeof count === 'number') {
      setRemoteLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, members: count } : l
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isGrowthOnly ? 'Growth tools' : 'Recipients'}
          </h1>
          <p className="text-muted-foreground">
            {isGrowthOnly
              ? 'Create signup forms and waitlists to capture demand.'
              : 'Build lists and smart segments to target awareness campaigns across channels.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setShowListModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New list / segment
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-soft-lg overflow-visible">
        {!isGrowthOnly && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
            <button
              onClick={() => setActiveTab('lists')}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                activeTab === 'lists' ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-white text-foreground'
              }`}
            >
              Lists & Segments
            </button>
          </div>
        )}

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
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Sort by</span>
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    value={contactSort.key}
                    onChange={(e) => setContactSort((prev) => ({ ...prev, key: e.target.value as any }))}
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="title">Title</option>
                    <option value="location">Location</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2"
                    onClick={() => setContactSort((prev) => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }))}
                  >
                    {contactSort.dir === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewMode('lists')}>Back to lists</Button>
                <Button variant="outline" size="sm" onClick={() => setShowContactModal(true)}>
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
            {([...contacts] as Contact[])
              .sort((a, b) => {
                const key = contactSort.key
                const dir = contactSort.dir === 'asc' ? 1 : -1
                const av = (a as any)[key]?.toLowerCase?.() || ''
                const bv = (b as any)[key]?.toLowerCase?.() || ''
                if (av < bv) return -1 * dir
                if (av > bv) return 1 * dir
                return 0
              })
              .map((contact, idx) => (
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
                <div className="flex items-center justify-end gap-2 relative">
                  <Button variant="outline" size="sm" onClick={() => setPreviewContact(contact)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setContactMenuId(contact.id === contactMenuId ? null : contact.id)
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  {contactMenuId === contact.id && (
                    <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-border/70 bg-card shadow-soft-lg">
                      <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setContactMenuId(null)
                          setEditContact(contact)
                          setEditName(contact.name)
                          setEditEmail(contact.email)
                          setEditPhone(contact.phone)
                          setEditTitle(contact.title)
                          setEditLocation(contact.location)
                          setEditTags((contact.tags || []).join(', '))
                          setEditChannels(contact.channels || '')
                          setShowEditContactModal(true)
                        }}
                      >
                        Edit details
                      </button>
                      <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={async () => {
                          setContactMenuId(null)
                          if (!currentOrgId) {
                            setContactsError('No organization context; please sign in again.')
                            return
                          }
                          setSavingContactId(contact.id)
                          setContactsError(null)
                          const { error } = await supabase
                            .from('recipient_contacts')
                            .update({
                              full_name: contact.name,
                              email: contact.email,
                              phone: contact.phone,
                              title: contact.title,
                              location: contact.location,
                            })
                            .eq('id', contact.id)
                            .eq('organization_id', currentOrgId || '')
                          setSavingContactId(null)
                          if (error) {
                            setContactsError(error.message || 'Failed to save contact')
                          }
                        }}
                      >
                        {savingContactId === contact.id ? 'Saving…' : 'Save changes'}
                      </button>
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          setContactMenuId(null)
                          if (!selectedListId) {
                            setContactsError('Select a list first.')
                            return
                          }
                          if (!currentOrgId) {
                            setContactsError('No organization context; please sign in again.')
                            return
                          }
                          setDeletingContactId(contact.id)
                          setContactsError(null)
                          await supabase
                            .from('recipient_contact_memberships')
                            .delete()
                            .eq('contact_id', contact.id)
                            .eq('list_id', selectedListId)
                          const { error } = await supabase
                            .from('recipient_contacts')
                            .delete()
                            .eq('id', contact.id)
                            .eq('organization_id', currentOrgId || '')
                          setDeletingContactId(null)
                          if (error) {
                            setContactsError(error.message || 'Failed to delete contact')
                            return
                          }
                          const next = contacts.filter((c) => c.id !== contact.id)
                          setContacts(next)
                          if (selectedListId) {
                            await refreshListCount(selectedListId)
                          }
                        }}
                      >
                        {deletingContactId === contact.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isGrowthOnly ? (
      <div className="p-4 space-y-4">
        <Card className="border-border/60 shadow-soft-lg">
          <div className="grid gap-4 md:grid-cols-3">
            <GrowthCard
              title="Create signup form"
              description="Capture new subscribers with branded forms and consent."
              cta="Create"
              onClick={() => setShowSignupModal(true)}
            />
            <GrowthCard
              title="Create waitlist"
              description="Launch a branded waitlist hero with email capture and sharing."
              cta="Launch"
              onClick={() => setShowWaitlistModal(true)}
            />
            <GrowthCard
              title="Import directory"
              description="Sync HRIS or CSV to keep lists fresh."
              cta="Connect"
            />
            <GrowthCard
              title="Preference pages"
              description="Let people tailor topics: wellbeing, DEI, safety, compliance."
              cta="Customize"
            />
            <GrowthCard
              title="Invite champions"
              description="Add campaign champions as reviewers before launch."
              cta="Add champions"
            />
          </div>
        </Card>
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Signup forms</p>
              <p className="text-sm text-muted-foreground">Share or embed to collect subscribers into a list.</p>
            </div>
            {signupLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
          </div>
          {signupError && <p className="text-xs text-red-600 mt-2">{signupError}</p>}
          <div className="space-y-2">
            {signupForms.map((form) => {
              const baseUrl =
                typeof window !== 'undefined'
                  ? window.location.origin
                  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const formUrl = `${baseUrl}/forms/${form.id}`
              return (
                <div key={form.id} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-3 py-2 md:flex-row md:items-center md:justify-between relative">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{form.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {form.description || 'No description'} • Target list: {listSource.find((l) => String(l.id) === String(form.target_list_id))?.name || 'None'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/forms/builder/${form.id}`}><Button size="sm" variant="outline">Builder</Button></Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(formUrl)
                          setSignupStatus('Link copied')
                          setTimeout(() => setSignupStatus(null), 1200)
                        } catch {
                          setSignupStatus('Copy failed')
                        }
                      }}
                    >
                      Copy link
                    </Button>
                    <Link href={`/forms/${form.id}`} target="_blank"><Button size="sm" variant="ghost">View</Button></Link>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      aria-label="Manage signup form"
                      onClick={() => setOpenFormMenuId(openFormMenuId === form.id ? null : form.id)}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                    {openFormMenuId === form.id && (
                      <div className="absolute right-3 top-12 z-20 w-48 rounded-xl border border-border/70 bg-white shadow-soft-lg p-1">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                          onClick={() => {
                            setOpenFormMenuId(null)
                            router.push(`/forms/builder/${form.id}`)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 text-red-600"
                          onClick={() => {
                            setOpenFormMenuId(null)
                            supabase.from('signup_forms').delete().eq('id', form.id)
                            setSignupForms((prev) => prev.filter((f) => f.id !== form.id))
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {!signupForms.length && !signupLoading && (
              <p className="text-sm text-muted-foreground">No signup forms yet. Create one to get started.</p>
            )}
            {signupStatus && <p className="text-xs text-muted-foreground">{signupStatus}</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Waitlists</p>
              <p className="text-sm text-muted-foreground">Share a launch-ready hero page to collect early-access interest.</p>
            </div>
            {signupLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
          </div>
          {signupError && <p className="text-xs text-red-600 mt-2">{signupError}</p>}
          <div className="space-y-2">
            {waitlistForms.map((form) => {
              const baseUrl =
                typeof window !== 'undefined'
                  ? window.location.origin
                  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const waitlistUrl = `${baseUrl}/waitlist/${form.id}`
              return (
                <div key={form.id} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-3 py-2 md:flex-row md:items-center md:justify-between relative">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{form.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {form.description || 'No description'} • Target list: {listSource.find((l) => String(l.id) === String(form.target_list_id))?.name || 'None'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/waitlist/builder/${form.id}`}><Button size="sm" variant="outline">Builder</Button></Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(waitlistUrl)
                          setWaitlistStatus('Link copied')
                          setTimeout(() => setWaitlistStatus(null), 1200)
                        } catch {
                          setWaitlistStatus('Copy failed')
                        }
                      }}
                    >
                      Copy link
                    </Button>
                    <Link href={`/waitlist/${form.id}`} target="_blank"><Button size="sm" variant="ghost">View</Button></Link>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      aria-label="Manage waitlist"
                      onClick={() => setOpenFormMenuId(openFormMenuId === form.id ? null : form.id)}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                    {openFormMenuId === form.id && (
                      <div className="absolute right-3 top-12 z-20 w-48 rounded-xl border border-border/70 bg-white shadow-soft-lg p-1">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                          onClick={() => {
                            setOpenFormMenuId(null)
                            router.push(`/waitlist/builder/${form.id}`)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 text-red-600"
                          onClick={() => {
                            setOpenFormMenuId(null)
                            supabase.from('signup_forms').delete().eq('id', form.id)
                            setWaitlistForms((prev) => prev.filter((f) => f.id !== form.id))
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {!waitlistForms.length && !signupLoading && (
              <p className="text-sm text-muted-foreground">No waitlists yet. Create one to get started.</p>
            )}
            {waitlistStatus && <p className="text-xs text-muted-foreground">{waitlistStatus}</p>}
          </div>
        </div>
        </div>
        ) : null}
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

      {showListModal && (
        <Modal onClose={() => setShowListModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">New list / segment</p>
                <p className="text-sm text-muted-foreground">Create a destination for contacts.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowListModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g., Field Team" />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {(['List', 'Segment'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={newListType === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewListType(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Tags (comma separated)</Label>
                <Input value={newListTags} onChange={(e) => setNewListTags(e.target.value)} placeholder="Org-wide, Field" />
              </div>
              {listError && <p className="text-xs text-red-600">{listError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowListModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!newListName.trim()) {
                    setListError('Name required')
                    return
                  }
                  if (orgLoading) {
                    setListError('Loading organization context, try again.')
                    return
                  }
                  if (!currentOrgId) {
                    setListError('No organization context; please sign in again.')
                    return
                  }
                  setSavingList(true)
                  setListError(null)
                  const { data, error } = await supabase
                    .from('recipient_lists')
                    .insert({
                      name: newListName.trim(),
                      type: newListType,
                      organization_id: currentOrgId,
                      tags: newListTags ? newListTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                    })
                    .select('id, name, type, tags, member_count, created_at')
                    .single()
                  setSavingList(false)
                  if (error || !data) {
                    setListError(error?.message || 'Failed to create list')
                    return
                  }
                  setRemoteLists((prev) => [{ id: data.id, name: data.name, type: data.type as 'List' | 'Segment', members: data.member_count ?? 0, created: data.created_at?.slice(0,10) || '', tags: data.tags || [] }, ...prev])
                  setNewListName('')
                  setNewListTags('')
                  setShowListModal(false)
                }}
                disabled={savingList}
              >
                {savingList ? 'Saving...' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showSignupModal && (
        <Modal onClose={() => setShowSignupModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Create signup form</p>
                <p className="text-sm text-muted-foreground">Collect subscribers and add them to a list.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSignupModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="e.g., Newsletter signup" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={signupDescription} onChange={(e) => setSignupDescription(e.target.value)} rows={2} placeholder="Short blurb shown on the form" />
              </div>
              <div className="space-y-1">
                <Label>Target list</Label>
                <select
                  value={signupTargetList}
                  onChange={(e) => setSignupTargetList(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a list (optional)</option>
                  {listSource.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Success message</Label>
                <Input value={signupSuccessMessage} onChange={(e) => setSignupSuccessMessage(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Consent text</Label>
                <Input value={signupConsentText} onChange={(e) => setSignupConsentText(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={signupAllowDuplicates}
                  onChange={(e) => setSignupAllowDuplicates(e.target.checked)}
                  className="h-4 w-4"
                />
                Allow duplicate submissions from same email
              </label>
              {signupError && <p className="text-xs text-red-600">{signupError}</p>}
              {signupStatus && <p className="text-xs text-muted-foreground">{signupStatus}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowSignupModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!signupName.trim()) {
                    setSignupError('Name is required')
                    return
                  }
                  if (orgLoading) {
                    setSignupError('Loading organization context, please try again in a moment.')
                    return
                  }
                  if (!currentOrgId) {
                    setSignupError('No organization context; please sign in again.')
                    return
                  }
                  setSignupError(null)
                  setSignupStatus('Saving...')
                  const payload = {
                    name: signupName.trim(),
                    description: signupDescription.trim(),
                    target_list_id: signupTargetList || null,
                    kind: 'signup',
                    organization_id: currentOrgId,
                    fields: baseSignupFields,
                    settings: {
                      double_opt_in: false,
                      allow_duplicates: signupAllowDuplicates,
                      consent_text: signupConsentText,
                    },
                    success_config: {
                      message: signupSuccessMessage,
                      redirect_url: null,
                    },
                  }
                  const { data, error } = await supabase
                    .from('signup_forms')
                    .insert(payload as any)
                    .select('id, name, description, target_list_id, success_config, created_at, kind')
                    .single()
                  if (error || !data) {
                    setSignupError(error?.message || 'Failed to create form')
                    setSignupStatus(null)
                    return
                  }
                  // Navigate directly to builder after creation
                  router.push(`/forms/builder/${data.id}`)
                  setSignupForms((prev) => [data, ...prev])
                  setSignupName('')
                  setSignupDescription('')
                  setSignupTargetList('')
                  setSignupAllowDuplicates(false)
                  setSignupStatus('Created!')
                  setTimeout(() => setSignupStatus(null), 1200)
                  setShowSignupModal(false)
                }}
              >
                Create form
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditContactModal && editContact && (
        <Modal onClose={() => setShowEditContactModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Edit contact</p>
                <p className="text-sm text-muted-foreground">Update fields, tags, and channels.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowEditContactModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tags (comma separated)</Label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Channels (comma or + separated)</Label>
                <Input value={editChannels} onChange={(e) => setEditChannels(e.target.value)} placeholder="Email, SMS" />
              </div>
            </div>
            {contactsError && <p className="text-xs text-red-600">{contactsError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowEditContactModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!currentOrgId) {
                    setContactsError('No organization context; please sign in again.')
                    return
                  }
                  const updatedTags = editTags.split(',').map((t) => t.trim()).filter(Boolean)
                  const updatedChannels = editChannels
                    .split(/[,+]/)
                    .map((c) => c.trim())
                    .filter(Boolean)
                  setSavingContactId(editContact.id)
                  const { error } = await supabase
                    .from('recipient_contacts')
                    .update({
                      full_name: editName,
                      email: editEmail,
                      phone: editPhone,
                      title: editTitle,
                      location: editLocation,
                      tags: updatedTags,
                      channels: updatedChannels.length ? updatedChannels : ['Email'],
                    })
                    .eq('id', editContact.id)
                    .eq('organization_id', currentOrgId)
                  setSavingContactId(null)
                  if (error) {
                    setContactsError(error.message || 'Failed to save contact')
                    return
                  }
                  setContacts((prev) =>
                    prev.map((c) =>
                      c.id === editContact.id
                        ? {
                            ...c,
                            name: editName,
                            email: editEmail,
                            phone: editPhone,
                            title: editTitle,
                            location: editLocation,
                            tags: updatedTags,
                            channels: updatedChannels.join(' + '),
                          }
                        : c
                    )
                  )
                  setShowEditContactModal(false)
                }}
              >
                {savingContactId === editContact.id ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showWaitlistModal && (
        <Modal onClose={() => setShowWaitlistModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Create waitlist</p>
                <p className="text-sm text-muted-foreground">Launch a landing hero to collect early access interest.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowWaitlistModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} placeholder="e.g., Product beta waitlist" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={waitlistDescription} onChange={(e) => setWaitlistDescription(e.target.value)} rows={2} placeholder="Short blurb shown on the hero" />
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(waitlistTemplates) as (keyof typeof waitlistTemplates)[]).map((key) => {
                    const tpl = waitlistTemplates[key]
                    const active = waitlistPreset === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setWaitlistPreset(key)}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          active ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-semibold">{tpl.name}</p>
                        <p className="text-[11px] text-muted-foreground">{tpl.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Headline</Label>
                <Input value={waitlistHeadline} onChange={(e) => setWaitlistHeadline(e.target.value)} placeholder="Join the waitlist" />
              </div>
              <div className="space-y-1">
                <Label>Subhead</Label>
                <Textarea value={waitlistSubhead} onChange={(e) => setWaitlistSubhead(e.target.value)} rows={2} placeholder="Be the first to know when we launch." />
              </div>
              <div className="space-y-1">
                <Label>CTA label</Label>
                <Input value={waitlistCtaLabel} onChange={(e) => setWaitlistCtaLabel(e.target.value)} placeholder="Join waitlist" />
              </div>
              <div className="space-y-1">
                <Label>Target list</Label>
                <select
                  value={waitlistTargetList}
                  onChange={(e) => setWaitlistTargetList(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a list (optional)</option>
                  {listSource.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              {waitlistError && <p className="text-xs text-red-600">{waitlistError}</p>}
              {waitlistStatus && <p className="text-xs text-muted-foreground">{waitlistStatus}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowWaitlistModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!waitlistName.trim()) {
                    setWaitlistError('Name is required')
                    return
                  }
                  if (orgLoading) {
                    setWaitlistError('Loading organization context, please try again in a moment.')
                    return
                  }
                  if (!currentOrgId) {
                    setWaitlistError('No organization context; please refresh and sign in again.')
                    return
                  }
                  setWaitlistError(null)
                  setWaitlistStatus('Saving...')
                  const payload = {
                    name: waitlistName.trim(),
                    description: waitlistDescription.trim(),
                    target_list_id: waitlistTargetList || null,
                    kind: 'waitlist',
                    organization_id: currentOrgId,
                    fields: baseSignupFields,
                    settings: {
                      double_opt_in: false,
                      allow_duplicates: false,
                      waitlist: {
                        template: waitlistPreset,
                        theme: waitlistTemplates[waitlistPreset].settings,
                        headline: waitlistHeadline.trim() || 'Join the waitlist',
                        subhead: waitlistSubhead.trim() || 'Be the first to know when we launch.',
                        cta_label: waitlistCtaLabel.trim() || 'Join waitlist',
                      },
                    },
                    success_config: {
                      message: 'You’re on the waitlist!',
                      redirect_url: null,
                    },
                  }
                  const { data, error } = await supabase
                    .from('signup_forms')
                    .insert(payload as any)
                    .select('id, name, description, target_list_id, success_config, created_at, kind')
                    .single()
                  if (error || !data) {
                    setWaitlistError(error?.message || 'Failed to create waitlist')
                    setWaitlistStatus(null)
                    return
                  }
                  router.push(`/waitlist/builder/${data.id}`)
                  setWaitlistForms((prev) => [data, ...prev])
                  setWaitlistName('')
                  setWaitlistDescription('')
                  setWaitlistTargetList('')
                  setWaitlistHeadline('Join the waitlist')
                  setWaitlistSubhead('Be the first to know when we launch.')
                  setWaitlistCtaLabel('Join waitlist')
                  setWaitlistPreset('glow')
                  setWaitlistStatus('Created!')
                  setTimeout(() => setWaitlistStatus(null), 1200)
                  setShowWaitlistModal(false)
                }}
              >
                {waitlistStatus === 'Saving...' ? 'Saving...' : 'Create waitlist'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Import CSV</p>
                <p className="text-sm text-muted-foreground">Columns: name,email,phone,title,location,tags,channels</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowImportModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Target list</Label>
                <select
                  value={importTargetList}
                  onChange={(e) => setImportTargetList(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a list</option>
                  {listSource.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>CSV file</Label>
                <Input type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
              </div>
              {importStatus && (
                <div className="flex items-center gap-3">
                  {lottieReady && /uploading|parsing|linking/i.test(importStatus) && (
                    <div className="flex-shrink-0">
                      {/* @ts-expect-error dotlottie web component */}
                      <dotlottie-wc
                        src="https://lottie.host/b905dcfb-2dfb-45a5-a4fd-236c0634436e/CGvwIy0IYy.lottie"
                        style={{ width: '48px', height: '48px' }}
                        autoplay
                        loop
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{importStatus}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!importFile || !importTargetList) {
                    setImportStatus('Select a list and choose a CSV file.')
                    return
                  }
                  if (orgLoading) {
                    setImportStatus('Loading organization context, try again.')
                    return
                  }
                  if (!currentOrgId) {
                    setImportStatus('No organization context; please sign in again.')
                    return
                  }
                  setImportStatus('Parsing CSV...')
                  const text = await importFile.text()
                  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
                  const headers = lines.shift()?.split(',').map((h) => h.trim().toLowerCase()) || []
                  const rows = lines.map((line) => {
                    const cols = line.split(',')
                    const clean = (val: string) => val.replace(/^"+|"+$/g, '').trim()
                    const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/"/g, '').replace(/\s+/g, '_'))
                    const getByKeys = (keys: string[]) => {
                      const idx = normalizedHeaders.findIndex((h) => keys.includes(h))
                      return idx >= 0 ? clean(cols[idx] || '') : ''
                    }
                    const metadata: Record<string, string> = {}
                    normalizedHeaders.forEach((h, idx) => {
                      if (!['name','full_name','fullname','email','phone','title','location','tags','channels','first_name','lastname','last_name','firstname','first','last'].includes(h) && cols[idx]?.trim()) {
                        metadata[h] = clean(cols[idx])
                      }
                    })
                    const first = getByKeys(['first_name','firstname','first'])
                    const last = getByKeys(['last_name','lastname','last'])
                    let fullName = getByKeys(['name','full_name','fullname'])
                    if (!fullName && (first || last)) {
                      fullName = [first, last].filter(Boolean).join(' ')
                    }
                    if (!fullName) {
                      fullName = getByKeys(['email']) // fallback to email if no name
                    }
                    if (first) metadata.first_name = first
                    if (last) metadata.last_name = last
                    return {
                      full_name: fullName || '',
                      email: getByKeys(['email']),
                      phone: getByKeys(['phone']),
                      title: getByKeys(['title']),
                      location: getByKeys(['location']),
                      tags: getByKeys(['tags']) ? getByKeys(['tags']).split('|').map((t) => t.trim()).filter(Boolean) : [],
                      channels: getByKeys(['channels']) ? getByKeys(['channels']).split('|').map((t) => t.trim()).filter(Boolean) : [],
                      metadata,
                      organization_id: currentOrgId,
                    }
                  }).filter((row) => row.email)

                  if (!rows.length) {
                    setImportStatus('No valid rows found.')
                    return
                  }

                  setImportStatus('Uploading contacts...')
                  const { data: insertedContacts, error: contactsErr } = await supabase
                    .from('recipient_contacts')
                    .insert(rows)
                    .select('id, email')

                  if (contactsErr || !insertedContacts?.length) {
                    setImportStatus(`Import failed: ${contactsErr?.message || 'unknown error'}`)
                    return
                  }

                  const memberships = insertedContacts.map((c: any) => ({
                    list_id: importTargetList,
                    contact_id: c.id,
                  }))
                  setImportStatus('Linking contacts to list...')
                  const { error: membershipErr } = await supabase
                    .from('recipient_contact_memberships')
                    .insert(memberships)

                  if (membershipErr) {
                    setImportStatus(`Linking failed: ${membershipErr.message || 'unknown error'}`)
                    return
                  }

                  setImportStatus('Imported successfully.')
                  await refreshListCount(importTargetList)
                  await fetchContacts(importTargetList)
                  fetchLists(true)
                  setTimeout(() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportStatus(null)
                  }, 800)
                }}
              >
                Import
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showContactModal && (
        <Modal onClose={() => setShowContactModal(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Add contact</p>
                <p className="text-sm text-muted-foreground">Add a single contact to the selected list.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowContactModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={newContact.email} onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))} />
                  </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={newContact.phone} onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={newContact.title} onChange={(e) => setNewContact((c) => ({ ...c, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={newContact.location} onChange={(e) => setNewContact((c) => ({ ...c, location: e.target.value }))} />
              </div>
                  <div className="space-y-1">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={newContact.tags.join(', ')}
                      onChange={(e) => setNewContact((c) => ({ ...c, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Custom fields (key/value)</Label>
                    <div className="space-y-2">
                      {customFields.map((field, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Key (e.g., department)"
                            value={field.key}
                            onChange={(e) => {
                              const next = [...customFields]
                              next[idx] = { ...next[idx], key: e.target.value }
                              setCustomFields(next)
                            }}
                          />
                          <Input
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => {
                              const next = [...customFields]
                              next[idx] = { ...next[idx], value: e.target.value }
                              setCustomFields(next)
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomFields((f) => [...f, { key: '', value: '' }])}
                      >
                        Add field
                      </Button>
                    </div>
                  </div>
                </div>
            {contactsError && <p className="text-xs text-red-600">{contactsError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowContactModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!selectedListId) {
                    setContactsError('Select a list first')
                    return
                  }
                  if (!newContact.email.trim()) {
                    setContactsError('Email required')
                    return
                  }
                  if (!firstName.trim() || !lastName.trim()) {
                    setContactsError('First and last name required')
                    return
                  }
                  if (orgLoading) {
                    setContactsError('Loading organization context, try again.')
                    return
                  }
                  if (!currentOrgId) {
                    setContactsError('No organization context; please sign in again.')
                    return
                  }
                  const metadata: Record<string, string> = {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                  }
                  customFields.forEach((f) => {
                    if (f.key && f.value) metadata[f.key] = f.value
                  })
                  const fullName = `${firstName.trim()} ${lastName.trim()}`
                  setContactsError(null)
                  const { data: contact, error } = await supabase
                    .from('recipient_contacts')
                    .insert({
                      full_name: fullName,
                      email: newContact.email,
                      phone: newContact.phone,
                      title: newContact.title,
                      location: newContact.location,
                      tags: newContact.tags,
                      channels: ['Email'],
                      metadata,
                      organization_id: currentOrgId,
                    })
                    .select('id, full_name, email, phone, title, location, tags, channels, metadata')
                    .single()

                  if (error || !contact) {
                    setContactsError(error?.message || 'Failed to add contact')
                    return
                  }

                  await supabase
                    .from('recipient_contact_memberships')
                    .insert({ list_id: selectedListId, contact_id: contact.id })

                  setContacts((prev) => [
                    ...prev,
                    {
                      id: contact.id,
                      name: fullName,
                      email: contact.email,
                      phone: contact.phone || '',
                      title: contact.title || '',
                      location: contact.location || '',
                      tags: (contact.tags as string[]) || [],
                      channels: Array.isArray(contact.channels) ? contact.channels.join(' + ') : '',
                      metadata: (contact as any)?.metadata || {},
                    },
                  ])

                  setShowContactModal(false)
                  setNewContact({ name: '', email: '', phone: '', title: '', location: '', tags: [], metadata: {} })
                  setFirstName('')
                  setLastName('')
                  setCustomFields([{ key: '', value: '' }])
                  await refreshListCount(selectedListId)
                  fetchLists(true)
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function GrowthCard({ title, description, cta, onClick }: { title: string; description: string; cta: string; onClick?: () => void }) {
  return (
    <Card className="border-border/60 shadow-soft-lg p-4 space-y-2">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm" onClick={onClick}>{cta}</Button>
    </Card>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-card shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function RecipientPreview({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-10">
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/70 bg-card shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Recipient preview</p>
                <h3 className="text-lg font-bold">{contact.name || contact.email || 'No name'}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{contact.title || '—'}</p>
                  <p className="text-muted-foreground">{contact.location || '—'}</p>
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
                  {(contact.tags || []).length
                    ? contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))
                    : <span className="text-muted-foreground">No tags</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Subscribed: {contact.channels || '—'}</span>
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
      </div>
    </>
  )
}
