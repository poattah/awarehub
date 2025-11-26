'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Mail,
  Megaphone,
  MessageSquare,
  Palette,
  Send,
  Sparkles,
  Users2,
  Wand2,
  X,
  Gamepad2,
  Image as ImageIcon,
} from 'lucide-react'

const presetAudiences = ['All Employees', 'People Managers', 'New Hires', 'Remote Teams', 'DEI Champions']
const presetChannels = ['Email', 'Slack', 'Microsoft Teams', 'Intranet Banner', 'Digital Signage']

const assetTypes = [
  { key: 'email', label: 'Email', icon: Mail, description: 'Send email campaigns to your audience' },
  { key: 'sms', label: 'SMS', icon: MessageSquare, description: 'Text message notifications' },
  { key: 'slack', label: 'Slack', icon: MessageSquare, description: 'Slack channel messages' },
  { key: 'quiz', label: 'Quiz Game', icon: Gamepad2, description: 'Interactive quiz for engagement' },
  { key: 'poster', label: 'Poster', icon: ImageIcon, description: 'Digital poster or graphics' },
] as const

const steps = [
  { key: 'setup', label: 'Setup', icon: Megaphone },
  { key: 'personalize', label: 'Personalize', icon: Palette },
  { key: 'recipients', label: 'Recipients', icon: Users2 },
  { key: 'review', label: 'Review & Send', icon: Send },
] as const

export default function CampaignBuilderPage() {
  const [activeStep, setActiveStep] = useState<(typeof steps)[number]['key']>('setup')

  // Campaign data
  const [assetType, setAssetType] = useState<string>('email')
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [launchDate, setLaunchDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [channels, setChannels] = useState<string[]>(['Email'])
  const [audience, setAudience] = useState<string[]>([])
  const [theme, setTheme] = useState<string>('Wellbeing')
  const [tone, setTone] = useState('')
  const [cadence, setCadence] = useState('Send now')

  // Email specific
  const [emailSubject, setEmailSubject] = useState('')
  const [emailPreviewText, setEmailPreviewText] = useState('')
  const [senderName, setSenderName] = useState('AwareHub')
  const [senderEmail, setSenderEmail] = useState('noreply@awarehub.com')
  const [emailHeadline, setEmailHeadline] = useState('Make this memorable')
  const [emailBody, setEmailBody] = useState('')
  const [emailButton, setEmailButton] = useState('View campaign')
  const [emailHero, setEmailHero] = useState('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('clean')

  // SMS specific
  const [smsMessage, setSmsMessage] = useState('')
  const [smsFrom, setSmsFrom] = useState('')
  const [smsPreview, setSmsPreview] = useState('Keep it short and clear.')
  const [smsTo, setSmsTo] = useState('')

  // Slack specific
  const [slackChannel, setSlackChannel] = useState('')
  const [slackMessage, setSlackMessage] = useState('')

  // Quiz specific
  const [quizTitle, setQuizTitle] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<string[]>([''])

  const emailTemplates = [
    { key: 'clean', title: 'Clean announcement', subtitle: 'Single CTA with hero image' },
    { key: 'digest', title: 'Highlights digest', subtitle: '3 cards + CTA' },
    { key: 'story', title: 'Story blocks', subtitle: 'Alternating text/media' },
    { key: 'poster', title: 'Poster drop', subtitle: 'Big visual with one liner' },
  ]

  const [showEmailDesigner, setShowEmailDesigner] = useState(false)
  const [showSmsDesigner, setShowSmsDesigner] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const draftLoaded = useRef(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignStatus, setCampaignStatus] = useState<'draft' | 'active' | 'scheduled' | 'completed'>('draft')
  const [audienceOptions, setAudienceOptions] = useState<string[]>(presetAudiences)

  const toggleSelection = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value))
    } else {
      setter([...list, value])
    }
  }

  const stepIndex = useMemo(() => steps.findIndex((s) => s.key === activeStep), [activeStep])

  const goToNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setActiveStep(steps[stepIndex + 1].key)
    }
  }

  const goToPrevStep = () => {
    if (stepIndex > 0) {
      setActiveStep(steps[stepIndex - 1].key)
    }
  }

  const handleSendCampaign = () => {
    if (assetType === 'sms' && !smsTo.trim()) {
      setSendError('Add a recipient phone number for SMS.')
      setShowSendModal(true)
      setSendState('error')
      return
    }
    setSendError(null)
    setShowSendModal(true)
    setSendState('sending')
    if (assetType === 'sms') {
      sendSms()
    } else {
      persistDraft().then(() => {
        setCampaignStatus('active')
        setSendState('sent')
      })
    }
  }

  const isStepComplete = (stepKey: string) => {
    switch (stepKey) {
      case 'setup':
        return name.trim().length > 0 && assetType.length > 0
      case 'personalize':
        return theme.length > 0
      case 'recipients':
        return channels.length > 0 && audience.length > 0
      default:
        return false
    }
  }

  const stepTitles = {
    setup: 'Campaign setup',
    personalize: 'Personalize it',
    recipients: 'Choose your recipients',
    review: 'Review and send'
  }

  useEffect(() => {
    // Fresh start for /campaigns/new
    setName('')
    setSummary('')
    setLaunchDate(new Date().toISOString().slice(0, 10))
    setCadence('Send now')
    setAssetType('email')
    setChannels(['Email'])
    setAudience([])
    setTheme('Wellbeing')
    setTone('')
    setEmailSubject('')
    setEmailPreviewText('')
    setSenderName('AwareHub')
    setSenderEmail('noreply@awarehub.com')
    setEmailHeadline('Make this memorable')
    setEmailBody('')
    setEmailButton('View campaign')
    setEmailHero('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80')
    setSelectedTemplate('clean')
    setSmsMessage('')
    setSmsFrom('')
    setSmsPreview('Keep it short and clear.')
    setSmsTo('')
    setCampaignStatus('draft')
    setCampaignId(null)
    setLastSavedAt(null)
    draftLoaded.current = true

    const loadLists = async () => {
      const { data, error } = await supabase
        .from('recipient_lists')
        .select('name')
        .order('name')
        .limit(50)
      if (!error && data?.length) {
        setAudienceOptions(data.map((d) => d.name))
      }
    }
    loadLists()
  }, [])

  const persistDraft = async () => {
    if (typeof window === 'undefined' || !draftLoaded.current) return
    if (!name.trim()) return
    setSavingDraft(true)
    const payload = {
      name,
      summary,
      launchDate,
      cadence,
      assetType,
      channels,
      audience,
      theme,
      tone,
      emailSubject,
      emailPreviewText,
      senderName,
      senderEmail,
      emailHeadline,
      emailBody,
      emailButton,
      emailHero,
      selectedTemplate,
      smsMessage,
      smsFrom,
      smsPreview,
      smsTo,
      lastSavedAt: new Date().toISOString(),
    }
    setLastSavedAt(payload.lastSavedAt)
    try {
      const res = await fetch('/api/campaigns/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaignId || undefined,
          name,
          summary,
          launchDate,
          cadence,
          assetType,
          channels,
          audience,
          theme,
          tone,
          status: campaignStatus,
          metadata: {
            emailSubject,
            emailPreviewText,
            senderName,
            senderEmail,
            emailHeadline,
            emailBody,
            emailButton,
            emailHero,
            selectedTemplate,
            smsMessage,
            smsFrom,
            smsPreview,
            smsTo,
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data?.id) {
        setCampaignId(data.id)
        if (data.status) setCampaignStatus(data.status)
      }
    } catch {
      // ignore network errors for autosave
    }
    setSavingDraft(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !draftLoaded.current) return
    const timeout = setTimeout(() => {
      persistDraft()
    }, 800)

    return () => clearTimeout(timeout)
  }, [
    name,
    summary,
    launchDate,
    cadence,
    assetType,
    channels,
    audience,
    theme,
    tone,
    emailSubject,
    emailPreviewText,
    senderName,
    senderEmail,
    emailHeadline,
    emailBody,
    emailButton,
    emailHero,
    selectedTemplate,
    smsMessage,
    smsFrom,
    smsPreview,
    smsTo,
  ])

  const formatSavedTime = (ts: string | null) => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const sendSms = async () => {
    setSendError(null)
    try {
      const res = await fetch('/api/integrations/twilio/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smsTo,
          body: smsMessage || 'Hi there from AwareHub',
          from: smsFrom || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Failed to send SMS')
      }
      setCampaignStatus('active')
      persistDraft()
      setSendState('sent')
    } catch (err: any) {
      setSendError(err.message || 'Failed to send SMS')
      setSendState('error')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/campaigns"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition"
          >
            <X className="h-4 w-4" />
            EXIT TO HOME PAGE
          </Link>
          <h1 className="text-lg font-bold">Campaigns</h1>
          <div className="flex items-center gap-3">
            <button className="text-sm text-primary hover:underline inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              Preview Campaign
            </button>
            <div className="text-xs text-muted-foreground">
              {savingDraft ? 'Saving...' : lastSavedAt ? `Saved ${formatSavedTime(lastSavedAt)}` : 'Autosave enabled'}
            </div>
            <Badge variant="outline">{campaignStatus || 'draft'}</Badge>
            <Button size="sm" onClick={persistDraft}>Save Now</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Title */}
        <h2 className="text-3xl font-bold text-center mb-8">
          {stepTitles[activeStep]}
        </h2>

        {/* Workflow Steps */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {steps.map((step, idx) => {
            const isActive = step.key === activeStep
            const isComplete = idx < stepIndex || isStepComplete(step.key)
            const Icon = step.icon

            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => setActiveStep(step.key)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isComplete
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isComplete && !isActive && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* SETUP STEP */}
          {activeStep === 'setup' && (
            <>
              <Card className="border-border/60 shadow-soft-lg bg-muted/30">
                <div className="p-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Campaign name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Mental Health Awareness Week"
                      className="text-lg rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary" className="text-sm font-semibold">Campaign objective</Label>
                    <Textarea
                      id="summary"
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="What should people know, feel, or do after this campaign?"
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="launch" className="text-sm font-semibold">Launch date</Label>
                      <Input
                        id="launch"
                        type="date"
                        value={launchDate}
                        onChange={(e) => setLaunchDate(e.target.value)}
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cadence" className="text-sm font-semibold">Cadence</Label>
                      <select
                        id="cadence"
                        value={cadence}
                        onChange={(e) => setCadence(e.target.value)}
                        className="w-full rounded-2xl border border-border/60 bg-card px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>Send now</option>
                        <option>Daily microlearning</option>
                        <option>Weekly digest</option>
                        <option>Event-based</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-border/60 shadow-soft-lg">
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Select Asset Type *</p>
                    <p className="text-sm text-muted-foreground">Pick a channel; we’ll tailor the design tools to your selection.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {assetTypes.map((type) => {
                      const Icon = type.icon
                      const selected = assetType === type.key
                      return (
                        <button
                          key={type.key}
                          onClick={() => setAssetType(type.key)}
                          className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                            selected ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/60 hover:border-primary/50'
                          }`}
                        >
                          {selected && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                          <div className={`p-2 rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        {assetType === 'email' ? <Mail className="h-6 w-6 text-primary" /> : <MessageSquare className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <p className="font-semibold">Customize Asset</p>
                        <p className="text-sm text-muted-foreground">
                          {assetType === 'email'
                            ? 'Email Design — personalize subject, sender, hero, and CTA.'
                            : 'SMS Design — set sender, message, and preview.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (assetType === 'email') setShowEmailDesigner(true)
                        if (assetType === 'sms') setShowSmsDesigner(true)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* PERSONALIZE STEP */}
          {activeStep === 'personalize' && (
            <Card className="border-border/60 shadow-soft-lg">
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Wellbeing', 'Inclusion', 'Safety', 'Sustainability', 'Compliance'].map((t) => (
                        <Button
                          key={t}
                          variant={theme === t ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTheme(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Additional notes</Label>
                    <Textarea
                      id="tone"
                      rows={3}
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="Any special instructions or tone guidelines..."
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* RECIPIENTS STEP */}
          {activeStep === 'recipients' && (
            <Card className="border-border/60 shadow-soft-lg">
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  {/* Dropdown Checklist for Audiences */}
                  <div className="space-y-3">
                    <Label>Select audiences *</Label>
                    <MultiSelectDropdown
                      options={audienceOptions}
                      selected={audience}
                      onChange={setAudience}
                      placeholder="Select one or more audiences"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Delivery channels *</Label>
                    <div className="flex flex-wrap gap-2">
                      {presetChannels.map((ch) => {
                        const selected = channels.includes(ch)
                        return (
                          <Button
                            key={ch}
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSelection(channels, ch, setChannels)}
                          >
                            {selected && <Check className="mr-2 h-4 w-4" />}
                            {ch}
                          </Button>
                        )
                      })}
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-primary">Recommendation</p>
                      </div>
                      <p className="text-muted-foreground">
                        Pair email with Slack/Teams to reach both desk and remote workers. Add an intranet banner for persistent visibility.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* REVIEW STEP */}
          {activeStep === 'review' && (
            <Card className="border-border/60 shadow-soft-lg">
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/40 p-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Asset type</span>
                      <Badge>{assetTypes.find(t => t.key === assetType)?.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Campaign name</span>
                      <span className="font-semibold">{name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Theme</span>
                      <Badge>{theme}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Launch date</span>
                      <span className="font-semibold">{launchDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cadence</span>
                      <span className="font-semibold">{cadence}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">Audiences</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {audience.length > 0 ? (
                          audience.map((a) => (
                            <Badge key={a} variant="outline" className="text-xs">
                              {a}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">Channels</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {channels.map((ch) => (
                          <Badge key={ch} variant="outline" className="text-xs">
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Ready to launch? Your campaign will be sent to all selected recipients.
                    </p>
                    <Button size="lg" className="w-full" onClick={handleSendCampaign}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Campaign
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={goToPrevStep}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            PREVIOUS
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button
              onClick={goToNextStep}
              disabled={!isStepComplete(activeStep)}
              className="inline-flex items-center gap-2"
            >
              Continue To {steps[stepIndex + 1].label}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSendCampaign}
              className="inline-flex items-center gap-2"
            >
              Send Campaign
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Help Button */}
      <button className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition">
        <span className="text-xl font-bold">?</span>
      </button>

      {showEmailDesigner && (
        <div className="fixed inset-0 z-40 flex bg-black/60">
          <div className="w-full lg:w-[320px] bg-card border-r border-border/60 p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Content blocks</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowEmailDesigner(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Text', 'Image', 'Button', 'Divider', 'Social', 'HTML', 'Video', 'Spacer'].map((block) => (
                <div key={block} className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-4 text-center text-muted-foreground">
                  {block}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Layouts</p>
              <div className="grid grid-cols-2 gap-2">
                {['1 Column', '2 Columns', 'Hero'].map((layout) => (
                  <div key={layout} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-center text-sm">
                    {layout}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-background overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Email template</p>
                  <h3 className="text-xl font-bold">Design canvas</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEmailDesigner(false)}>Cancel</Button>
                  <Button onClick={() => setShowEmailDesigner(false)}>Save & return</Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {emailTemplates.map((tpl) => (
                      <button
                        key={tpl.key}
                        onClick={() => setSelectedTemplate(tpl.key)}
                        className={`rounded-xl border p-3 text-left transition ${
                          selectedTemplate === tpl.key ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/60 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{tpl.title}</p>
                          {selectedTemplate === tpl.key && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{tpl.subtitle}</p>
                        <div className="mt-3 rounded-lg bg-muted/50 h-20 border border-dashed border-border/60" />
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label>Subject line</Label>
                      <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Hi @firstname, @companyName has news" />
                    </div>
                    <div className="space-y-1">
                      <Label>Preview text</Label>
                      <Input value={emailPreviewText} onChange={(e) => setEmailPreviewText(e.target.value)} placeholder="One-line teaser shown in inbox" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Sender name</Label>
                        <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Sender email</Label>
                        <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Hero image URL</Label>
                        <Input value={emailHero} onChange={(e) => setEmailHero(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>CTA label</Label>
                        <Input value={emailButton} onChange={(e) => setEmailButton(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Headline</Label>
                      <Input value={emailHeadline} onChange={(e) => setEmailHeadline(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Body copy</Label>
                      <Textarea rows={6} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Add the main story or instructions." />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Live preview</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2 py-1">Desktop</span>
                      <span className="rounded-full border px-2 py-1 bg-muted/40">Mobile</span>
                    </div>
                  </div>
                  <Card className="border-border/60 shadow-soft-lg overflow-hidden">
                    <div className="border-b border-border/60 px-4 py-3">
                      <p className="text-xs text-muted-foreground">From: {senderName} &lt;{senderEmail}&gt;</p>
                      <p className="text-sm font-semibold">{emailSubject || 'Subject line goes here'}</p>
                      <p className="text-xs text-muted-foreground truncate">{emailPreviewText || 'Preview text will display here'}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/30">
                        <img src={emailHero} alt="" className="w-full h-44 object-cover" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold">{emailHeadline || 'Headline'}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {emailBody || 'Write a concise message that drives action. Keep it clear and purposeful.'}
                        </p>
                      </div>
                      <Button className="w-full">{emailButton || 'Call to action'}</Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSmsDesigner && (
        <div className="fixed inset-0 z-40 flex bg-black/60">
          <div className="w-full lg:w-[320px] bg-card border-r border-border/60 p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">SMS blocks</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSmsDesigner(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Keep it concise. You can insert short links and personalization tags (e.g., @firstname).</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Quick presets</p>
              <div className="grid gap-2">
                {[
                  'Reminder: Join us today at 3 PM for the awareness session.',
                  'Hi @firstname, new resources are live. Check the link.',
                  'Action needed: Complete the quiz by Friday.',
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setSmsMessage(preset)
                      setSmsPreview(preset)
                    }}
                    className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-left text-sm hover:border-primary/40"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-background overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SMS template</p>
                  <h3 className="text-xl font-bold">Design canvas</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowSmsDesigner(false)}>Cancel</Button>
                  <Button onClick={() => setShowSmsDesigner(false)}>Save & return</Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>To (E.164 format)</Label>
                    <Input
                      value={smsTo}
                      onChange={(e) => setSmsTo(e.target.value)}
                      placeholder="+18777804236"
                    />
                    <p className="text-xs text-muted-foreground">Required to send the SMS.</p>
                  </div>
                  <div className="space-y-1">
                    <Label>From (Messaging Service SID or phone)</Label>
                    <Input
                      value={smsFrom}
                      onChange={(e) => setSmsFrom(e.target.value)}
                      placeholder="e.g., MGxxxx or +15551234567"
                    />
                    <p className="text-xs text-muted-foreground">If empty, backend uses TWILIO_MESSAGING_SERVICE_SID.</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Message</Label>
                    <Textarea
                      rows={5}
                      value={smsMessage}
                      onChange={(e) => {
                        setSmsMessage(e.target.value)
                        setSmsPreview(e.target.value)
                      }}
                      placeholder="Keep it short and clear..."
                      maxLength={320}
                    />
                    <p className="text-xs text-muted-foreground">{smsMessage.length}/320 characters</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Preview</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2 py-1 bg-muted/40">Mobile</span>
                    </div>
                  </div>
                  <Card className="border-border/60 shadow-soft-lg overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{smsPreview || 'Your SMS preview will appear here.'}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        From: {smsFrom || 'Messaging Service'}<br />
                        To: {smsTo || 'Not set'}<br />
                        Est. segments: {Math.max(1, Math.ceil((smsMessage.length || 1) / 160))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-soft-lg overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-6 top-6 h-3 w-3 rounded-full bg-primary/40 animate-ping" />
              <div className="absolute -right-6 top-10 h-3 w-3 rounded-full bg-amber-400/60 animate-ping" />
              <div className="absolute left-10 bottom-8 h-3 w-3 rounded-full bg-emerald-400/60 animate-ping" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Sending campaign</p>
                <Button variant="ghost" size="icon" onClick={() => { setShowSendModal(false); setSendState('idle') }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
                  <div className="absolute h-20 w-28 rounded-lg bg-gradient-to-br from-orange-300 via-pink-400 to-rose-500 animate-bounce" />
                  <div className="relative h-16 w-24 rounded-md bg-white border border-border/60 shadow-md flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  {sendState === 'sent' && (
                    <div className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow">
                      <Check className="h-5 w-5 text-emerald-700" />
                    </div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold">
                    {sendState === 'sent' ? 'Campaign sent!' : sendState === 'error' ? 'Send failed' : 'Launching your campaign...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sendState === 'sent'
                      ? 'Your campaign is on its way to all selected recipients.'
                      : sendState === 'error'
                      ? sendError || 'We could not send your campaign. Check the SMS fields and try again.'
                      : 'Packaging assets, syncing recipients, and dispatching to channels.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={`h-2 w-2 rounded-full ${sendState === 'error' ? 'bg-red-500' : 'bg-primary'} animate-pulse`} />
                  <span>
                    {sendState === 'sent'
                      ? 'Completed'
                      : sendState === 'error'
                      ? 'Error'
                      : 'Sending...'}
                  </span>
                </div>
                {sendState === 'sent' && (
                  <Button className="w-full" onClick={() => { setShowSendModal(false); setSendState('idle') }}>
                    View campaign log
                  </Button>
                )}
                {sendState === 'error' && (
                  <Button className="w-full" variant="outline" onClick={() => { setSendState('sending'); sendSms() }}>
                    Retry send
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Multi-Select Dropdown Component
function MultiSelectDropdown({ options, selected, onChange, placeholder }: {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-2.5 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-muted-foreground' : ''}>
          {selected.length === 0
            ? placeholder
            : `${selected.length} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-border/60 bg-card shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center justify-between transition"
              >
                <span>{option}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected items display */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="inline-flex items-center gap-1"
            >
              {item}
              <button
                onClick={() => toggleOption(item)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
