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
  const [emailBody, setEmailBody] = useState('')

  // SMS specific
  const [smsMessage, setSmsMessage] = useState('')

  // Slack specific
  const [slackChannel, setSlackChannel] = useState('')
  const [slackMessage, setSlackMessage] = useState('')

  // Quiz specific
  const [quizTitle, setQuizTitle] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<string[]>([''])

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
            <Button size="sm">Save Changes</Button>
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
        <div className="max-w-2xl mx-auto">
          {/* SETUP STEP */}
          {activeStep === 'setup' && (
            <Card className="border-border/60 shadow-soft-lg">
              <div className="p-8 space-y-6">
                {/* Asset Type Selection */}
                <div className="space-y-3">
                  <Label>Select Asset Type *</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {assetTypes.map((type) => {
                      const Icon = type.icon
                      const selected = assetType === type.key
                      return (
                        <button
                          key={type.key}
                          onClick={() => setAssetType(type.key)}
                          className={`relative rounded-xl border-2 p-4 text-left transition ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border/60 hover:border-primary/50'
                          }`}
                        >
                          {selected && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{type.label}</p>
                              <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/60">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Mental Health Awareness Week"
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Campaign objective</Label>
                    <Textarea
                      id="summary"
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="What should people know, feel, or do after this campaign?"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="launch">Launch date</Label>
                      <Input
                        id="launch"
                        type="date"
                        value={launchDate}
                        onChange={(e) => setLaunchDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cadence">Cadence</Label>
                      <select
                        id="cadence"
                        value={cadence}
                        onChange={(e) => setCadence(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>Send now</option>
                        <option>Daily microlearning</option>
                        <option>Weekly digest</option>
                        <option>Event-based</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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

                  {/* Asset type specific configuration */}
                  {assetType === 'email' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="emailSubject">Email subject line</Label>
                        <Input
                          id="emailSubject"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="e.g., Let's talk about mental health"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailBody">Email body</Label>
                        <Textarea
                          id="emailBody"
                          rows={6}
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="Write your email message here..."
                        />
                      </div>
                    </>
                  )}

                  {assetType === 'sms' && (
                    <div className="space-y-2">
                      <Label htmlFor="smsMessage">SMS message (160 characters)</Label>
                      <Textarea
                        id="smsMessage"
                        rows={3}
                        maxLength={160}
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Keep it short and impactful..."
                      />
                      <p className="text-xs text-muted-foreground">{smsMessage.length}/160 characters</p>
                    </div>
                  )}

                  {assetType === 'slack' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="slackChannel">Slack channel</Label>
                        <Input
                          id="slackChannel"
                          value={slackChannel}
                          onChange={(e) => setSlackChannel(e.target.value)}
                          placeholder="e.g., #general, #announcements"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slackMessage">Slack message</Label>
                        <Textarea
                          id="slackMessage"
                          rows={4}
                          value={slackMessage}
                          onChange={(e) => setSlackMessage(e.target.value)}
                          placeholder="Write your Slack message..."
                        />
                      </div>
                    </>
                  )}

                  {assetType === 'quiz' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="quizTitle">Quiz title</Label>
                        <Input
                          id="quizTitle"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          placeholder="e.g., Mental Health Awareness Quiz"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quiz questions</Label>
                        {quizQuestions.map((q, idx) => (
                          <Input
                            key={idx}
                            value={q}
                            onChange={(e) => {
                              const updated = [...quizQuestions]
                              updated[idx] = e.target.value
                              setQuizQuestions(updated)
                            }}
                            placeholder={`Question ${idx + 1}`}
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuizQuestions([...quizQuestions, ''])}
                        >
                          Add Question
                        </Button>
                      </div>
                    </>
                  )}

                  {assetType === 'poster' && (
                    <div className="space-y-2">
                      <Label>Upload poster image</Label>
                      <div className="rounded-xl border-2 border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drag image here or <span className="text-primary font-semibold cursor-pointer">browse</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {assetType !== 'quiz' && assetType !== 'poster' && (
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
                  )}
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
                      options={presetAudiences}
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
                    <Button size="lg" className="w-full">
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
              onClick={() => alert('Campaign sent!')}
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
