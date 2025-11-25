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
        .select('id, name, description, status, start_at, metadata')
        .order('start_at', { ascending: false })
        .limit(12)

      if (!active) return

      if (error) {
        setError('Supabase fetch failed; showing sample campaigns.')
        setLoading(false)
        return
      }

      if (data && data.length) {
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
  }, [autoSeedAttempted])

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
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔎</span>
            </div>
            <Button variant="outline">All Status</Button>
            <Button variant="outline">All Categories</Button>
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
        ) : (
          campaigns.map((campaign) => (
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
                <Button className="flex-1">Use this layout</Button>
                <Button variant="outline" className="flex-1">
                  Export poster
                </Button>
              </div>
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
    'active': 'default',
    'scheduled': 'secondary',
    'completed': 'outline',
    'draft': 'outline',
  }
  return variants[status] || 'outline'
}
