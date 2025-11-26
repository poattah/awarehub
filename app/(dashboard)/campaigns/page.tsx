'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Brush,
  Eye,
  Layers,
  Megaphone,
  MoreVertical,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from 'lucide-react'

type Campaign = {
  id: string | number
  name: string
  description: string
  status: string
  date: string
  engagement: number
  reach: number
  channels: string[]
  assetImage: string
}

export default function CampaignsPage() {
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>(fallbackCampaigns)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePreview = (campaign: Campaign) => {
    setSelected(campaign)
    setIsPreviewOpen(true)
  }

  useEffect(() => {
    let active = true

    const fetchCampaigns = async (skipSeed?: boolean) => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, description, status, start_at, metadata, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (!active) return

      if (error) {
        console.error('Failed to fetch campaigns:', error)
        setError('Supabase fetch failed; showing sample campaigns.')
        setLoading(false)
        return
      }

      if (data && data.length) {
        console.log(`✅ Loaded ${data.length} campaigns from Supabase`)
        const mapped = data.map((item) => {
          const meta = (item as any).metadata || {}
          const startDate = item.start_at ? new Date(item.start_at).toLocaleDateString() : 'Not scheduled'
          return {
            id: item.id,
            name: item.name,
            description: item.description || '—',
            status: item.status || 'draft',
            date: startDate,
            engagement: meta.engagement ?? 0,
            reach: meta.reach ?? 0,
            channels: Array.isArray(meta.channels) ? meta.channels : ['Email', 'Slack'],
            assetImage:
              meta.asset_image ||
              'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=320&q=80',
          } satisfies Campaign
        })
        setCampaigns(mapped)
        setLoading(false)
        return
      }

      console.warn('No campaigns found in database')

      if (!skipSeed && !autoSeedAttempted) {
        const seedRes = await fetch('/api/internal/bootstrap-campaigns', { method: 'POST' })
        setAutoSeedAttempted(true)

        if (!seedRes.ok) {
          setError('No campaigns found; auto-seed failed. Showing sample data.')
          setLoading(false)
          return
        }

        // After seeding, refetch
        return fetchCampaigns(true)
      }

      setError('No campaigns found in Supabase; showing sample campaigns.')
      setLoading(false)
    }

    fetchCampaigns()

    return () => {
      active = false
    }
  }, [autoSeedAttempted, refreshTrigger])

  // Filter campaigns based on status and search query
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
      const matchesSearch =
        searchQuery === '' ||
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [campaigns, statusFilter, searchQuery])

  // Count campaigns by status
  const statusCounts = useMemo(() => {
    return {
      all: campaigns.length,
      draft: campaigns.filter(c => c.status === 'draft').length,
      active: campaigns.filter(c => c.status === 'active').length,
      scheduled: campaigns.filter(c => c.status === 'scheduled').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
    }
  }, [campaigns])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage, preview, and design your awareness campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            title="Refresh campaigns"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/campaigns/new">
            <Button>
              <Megaphone className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-2">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔎</span>
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('draft')}
            >
              📝 Drafts ({statusCounts.draft})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              ✅ Active ({statusCounts.active})
            </Button>
            <Button
              variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('scheduled')}
            >
              📅 Scheduled ({statusCounts.scheduled})
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              ✓ Completed ({statusCounts.completed})
            </Button>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner className="h-5 w-5" />
            Loading campaigns from Supabase...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="border-border/60 shadow-soft">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No campaigns found matching "${searchQuery}"`
                  : statusFilter !== 'all'
                  ? `No ${statusFilter} campaigns found`
                  : 'No campaigns found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-soft-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      <Badge variant={getStatusVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardDescription>{campaign.description}</CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>📅 {campaign.date}</span>
                      <span>•</span>
                      <span>📊 {campaign.engagement}% engagement</span>
                      <span>•</span>
                      <span>👥 {campaign.reach} reached</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {campaign.channels.map((channel) => (
                      <Badge key={channel} variant="outline">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(campaign)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview & Design
                    </Button>
                    <Link href="/campaigns/new">
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isPreviewOpen && selected && (
        <PreviewModal campaign={selected} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  )
}

function PreviewModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [poster, setPoster] = useState({
    title: campaign.name,
    subtitle: campaign.description,
    accent: '#FBBF24',
    bg: '#F5F2EB',
    image: campaign.assetImage,
  })
  const [asset, setAsset] = useState({
    subject: `Hi @firstname, ${campaign.name} is live!`,
    headline: '@companyName invites you to join',
    body: 'Explore resources, join live sessions, and share feedback. We made this easy to act on.',
    cta: 'View campaign',
    image: campaign.assetImage,
  })

  const palette = useMemo(
    () => [
      { label: 'Amber', accent: '#FBBF24', bg: '#FDF6E3' },
      { label: 'Cobalt', accent: '#2563EB', bg: '#E5ECFB' },
      { label: 'Mint', accent: '#10B981', bg: '#E8F7F1' },
      { label: 'Coral', accent: '#F97316', bg: '#FFF1E6' },
    ],
    []
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-6xl rounded-3xl border border-border/70 bg-card shadow-soft-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 sticky top-0 bg-card/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Preview & Design</p>
              <p className="font-semibold text-lg">{campaign.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr] overflow-y-auto">
          <Card className="border-border/60 shadow-soft-lg overflow-hidden">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Poster canvas</p>
            </div>
            <div className="p-4 space-y-4">
              <div
                className="relative overflow-hidden rounded-2xl border border-border/60 shadow-soft-lg"
                style={{
                  background: poster.bg,
                }}
              >
                <div className="absolute top-3 right-3 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold" style={{ color: poster.accent }}>
                  Awareness
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-[2fr_1fr] items-center">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Campaign message</p>
                    <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                      {poster.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{poster.subtitle}</p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold" style={{ color: poster.accent }}>
                      Live from {campaign.date}
                    </div>
                  </div>
                  <div className="aspect-[4/5] rounded-xl bg-white/70 shadow-soft relative overflow-hidden">
                    <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 30% 30%, ${poster.accent}22, transparent 45%)` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src={poster.image} alt="" className="h-32 w-32 object-cover rounded-xl border border-border/60 shadow-soft" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Poster title</Label>
                  <Input value={poster.title} onChange={(e) => setPoster((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Accent color</Label>
                  <div className="flex flex-wrap gap-2">
                    {palette.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setPoster((p) => ({ ...p, accent: item.accent, bg: item.bg }))}
                        className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-sm shadow-soft hover:scale-105 transition"
                        style={{ background: item.bg, color: item.accent }}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ background: item.accent }} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Subheading</Label>
                  <Textarea
                    rows={2}
                    value={poster.subtitle}
                    onChange={(e) => setPoster((p) => ({ ...p, subtitle: e.target.value }))}
                    placeholder="Add more context about why this matters."
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 shadow-soft-lg overflow-hidden">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center gap-2">
              <Brush className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Email / asset design</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-2xl border border-border/60 bg-white shadow-soft-lg overflow-hidden">
                <div className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Subject</span>
                  <span className="font-semibold text-foreground truncate max-w-[60%]">{asset.subject}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3 flex items-center justify-center">
                    <img src={asset.image} alt="" className="h-24 w-24 object-cover rounded-lg border border-border/60 shadow-soft" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{asset.headline}</p>
                    <p className="text-sm text-muted-foreground">{asset.body}</p>
                  </div>
                  <Button className="w-full" style={{ background: poster.accent, color: '#0F172A' }}>
                    {asset.cta}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Input value={asset.subject} onChange={(e) => setAsset((p) => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Headline</Label>
                  <Input value={asset.headline} onChange={(e) => setAsset((p) => ({ ...p, headline: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Body copy</Label>
                  <Textarea rows={2} value={asset.body} onChange={(e) => setAsset((p) => ({ ...p, body: e.target.value }))} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>CTA label</Label>
                    <Input value={asset.cta} onChange={(e) => setAsset((p) => ({ ...p, cta: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Hero image URL</Label>
                    <Input value={asset.image} onChange={(e) => setAsset((p) => ({ ...p, image: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 shadow-soft-lg overflow-hidden">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Campaign snapshot</p>
            </div>
            <div className="p-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Channels</span>
                <span className="font-semibold text-foreground">{campaign.channels.join(' • ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-semibold text-foreground capitalize">{campaign.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Launch</span>
                <span className="font-semibold text-foreground">{campaign.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reach</span>
                <span className="font-semibold text-foreground">{campaign.reach}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Engagement</span>
                <span className="font-semibold text-foreground">{campaign.engagement}%</span>
              </div>
              <div className="pt-2 flex gap-2">
                <Button className="flex-1" onClick={() => setShowSendModal(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Campaign
                </Button>
                <Button variant="outline" className="flex-1">
                  Export poster
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showSendModal && (
        <SendCampaignModal
          campaign={campaign}
          emailContent={asset}
          accentColor={poster.accent}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  )
}

type SendCampaignModalProps = {
  campaign: Campaign
  emailContent: {
    subject: string
    headline: string
    body: string
    cta: string
    image: string
  }
  accentColor: string
  onClose: () => void
}

function SendCampaignModal({ campaign, emailContent, accentColor, onClose }: SendCampaignModalProps) {
  const [recipientLists, setRecipientLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [ctaUrl, setCtaUrl] = useState('https://your-campaign-url.com')

  useEffect(() => {
    const fetchRecipientLists = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('recipient_lists')
        .select('id, name, member_count')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Failed to load recipient lists')
      } else {
        setRecipientLists(data || [])
        if (data && data.length > 0) {
          setSelectedListId(data[0].id)
        }
      }
      setLoading(false)
    }

    fetchRecipientLists()
  }, [])

  const handleSendTest = async () => {
    if (!testEmail) {
      setError('Please enter a test email address')
      return
    }

    setSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/campaigns/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          subject: emailContent.subject,
          headline: emailContent.headline,
          bodyText: emailContent.body,
          ctaLabel: emailContent.cta,
          ctaUrl,
          imageUrl: emailContent.image,
          accentColor,
          testMode: true,
          testEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setError(data.error || 'Failed to send test email')
      } else {
        setResult({ type: 'test', ...data })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send test email')
    } finally {
      setSending(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!selectedListId) {
      setError('Please select a recipient list')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this campaign to all recipients in the selected list? This action cannot be undone.`
    )

    if (!confirmed) return

    setSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/campaigns/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          recipientListId: selectedListId,
          subject: emailContent.subject,
          headline: emailContent.headline,
          bodyText: emailContent.body,
          ctaLabel: emailContent.cta,
          ctaUrl,
          imageUrl: emailContent.image,
          accentColor,
          testMode: false,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setError(data.error || 'Failed to send campaign')
      } else {
        setResult({ type: 'campaign', ...data })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-border/70 bg-card shadow-soft-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Send Campaign</p>
              <p className="font-semibold text-lg">{campaign.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {result && (
            <div className={`rounded-xl border p-4 ${result.type === 'test' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
              <p className={`text-sm font-semibold ${result.type === 'test' ? 'text-blue-900' : 'text-green-900'}`}>
                {result.message}
              </p>
              {result.type === 'campaign' && (
                <div className="mt-2 text-xs text-green-800">
                  <p>✅ Sent: {result.sentCount}</p>
                  {result.failureCount > 0 && <p>❌ Failed: {result.failureCount}</p>}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          )}

          {/* Email Preview */}
          <Card className="border-border/60 shadow-soft">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold">Email Preview</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-border/60 bg-white shadow-soft overflow-hidden">
                <div className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Subject</span>
                  <span className="font-semibold text-foreground truncate max-w-[60%]">{emailContent.subject}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3 flex items-center justify-center">
                    <img src={emailContent.image} alt="" className="h-24 w-24 object-cover rounded-lg border border-border/60 shadow-soft" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{emailContent.headline}</p>
                    <p className="text-sm text-muted-foreground">{emailContent.body}</p>
                  </div>
                  <Button className="w-full" style={{ background: accentColor, color: '#FFFFFF' }}>
                    {emailContent.cta}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Campaign URL (CTA Destination)</Label>
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://your-campaign-url.com"
                />
              </div>
            </div>
          </Card>

          {/* Test Email */}
          <Card className="border-border/60 shadow-soft">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold">Send Test Email</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <Label>Test Email Address</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendTest}
                disabled={sending || !testEmail}
              >
                {sending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Send to Recipients */}
          <Card className="border-border/60 shadow-soft">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold">Send to Recipients</p>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoadingSpinner className="h-4 w-4" />
                  Loading recipient lists...
                </div>
              ) : recipientLists.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No recipient lists found. Please create a recipient list first.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Recipient List</Label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {recipientLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name} ({list.member_count || 0} recipients)
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSendCampaign}
                    disabled={sending || !selectedListId}
                  >
                    {sending ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Sending Campaign...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Campaign to All Recipients
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

const fallbackCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'Mental Health Awareness Week',
    description: 'A week-long campaign to promote mental health awareness and resources.',
    status: 'active',
    date: 'May 1-7, 2024',
    engagement: 42,
    reach: 847,
    channels: ['Slack', 'Email', 'Intranet'],
    assetImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 2,
    name: 'Pride Month Celebration',
    description: 'Celebrate diversity and inclusion throughout June.',
    status: 'scheduled',
    date: 'June 2024',
    engagement: 0,
    reach: 0,
    channels: ['Slack', 'Teams', 'Email'],
    assetImage: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 3,
    name: 'Earth Day Initiative',
    description: 'Environmental awareness and sustainability tips.',
    status: 'completed',
    date: 'April 22, 2024',
    engagement: 38,
    reach: 732,
    channels: ['Email', 'Intranet'],
    assetImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 4,
    name: 'Women in Tech Series',
    description: 'Highlighting achievements of women in technology.',
    status: 'draft',
    date: 'Not scheduled',
    engagement: 0,
    reach: 0,
    channels: ['Slack'],
    assetImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=320&q=80',
  },
]

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'active': 'default',      // Green/primary for active campaigns
    'scheduled': 'secondary', // Blue for scheduled
    'completed': 'outline',   // Gray for completed
    'draft': 'outline',       // Gray for drafts
    'archived': 'outline',    // Gray for archived
  }
  return variants[status] || 'outline'
}
