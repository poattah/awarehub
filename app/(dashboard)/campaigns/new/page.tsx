'use client'

import { useMemo, useState } from 'react'
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
  ChevronRight,
  Globe2,
  Layers,
  Megaphone,
  Send,
  Users2,
  X,
} from 'lucide-react'

type Step = {
  key: string
  label: string
  icon: React.ReactNode
}

const steps: Step[] = [
  { key: 'setup', label: 'Setup', icon: <Megaphone className="h-4 w-4" /> },
  { key: 'content', label: 'Content', icon: <Layers className="h-4 w-4" /> },
  { key: 'audience', label: 'Audience', icon: <Users2 className="h-4 w-4" /> },
  { key: 'review', label: 'Review', icon: <Check className="h-4 w-4" /> },
]

const presetAudiences = ['All Employees', 'People Managers', 'New Hires', 'Remote Teams', 'DEI Champions']
const presetChannels = ['Email', 'Slack', 'Microsoft Teams', 'Intranet Banner', 'Digital Signage']

export default function CampaignBuilderPage() {
  const [activeStep, setActiveStep] = useState('setup')
  const [showConfirmExit, setShowConfirmExit] = useState(false)
  const [name, setName] = useState('Mental Health Awareness Week')
  const [summary, setSummary] = useState('A week-long awareness program with daily nudges, resources, and manager talking points.')
  const [launchDate, setLaunchDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [channels, setChannels] = useState<string[]>(['Email', 'Slack'])
  const [audience, setAudience] = useState<string[]>(['All Employees'])

  const toggleSelection = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value))
    } else {
      setter([...list, value])
    }
  }

  const stepIndex = useMemo(() => steps.findIndex((s) => s.key === activeStep), [activeStep])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-b from-primary/10 via-primary/5 to-background p-6 shadow-soft-lg border border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to campaigns
            </Link>
            <Badge variant="outline" className="bg-white/60 backdrop-blur text-xs">Awareness builder</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmExit(true)}>
              Discard
            </Button>
            <Button variant="outline" size="sm">
              Preview
            </Button>
            <Button size="sm">
              Save Draft
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-primary font-semibold uppercase tracking-wide">Campaign setup</p>
          <h1 className="text-3xl font-bold tracking-tight">Your awareness campaign is almost ready</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Craft the content, pick the audiences, and schedule delivery across channels. Nothing sends until you review and launch.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {steps.map((step, idx) => {
            const isActive = step.key === activeStep
            const isComplete = idx < stepIndex
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 rounded-full px-4 py-2 border ${
                  isActive
                    ? 'border-primary bg-white shadow-soft-lg'
                    : 'border-border/70 bg-white/60'
                }`}
              >
                <div className={`h-8 w-8 flex items-center justify-center rounded-full ${isComplete ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                  {step.icon}
                </div>
                <div className="text-sm font-semibold">{step.label}</div>
                {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <SectionCard
          number="1"
          title="Campaign details"
          description="Name, objectives, and outcomes for this awareness push."
          actionLabel="Next: Content"
          onAction={() => setActiveStep('content')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Psychological Safety Month"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="launch">Launch date</Label>
              <Input
                id="launch"
                type="date"
                value={launchDate}
                onChange={(e) => setLaunchDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="summary">Objective</Label>
              <Textarea
                id="summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What do you want employees to learn, feel, or do?"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          number="2"
          title="Content & assets"
          description="Select templates, attach assets, and set tone for awareness."
          actionLabel="Next: Audience"
          onAction={() => setActiveStep('audience')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Content theme</Label>
              <div className="flex flex-wrap gap-2">
                {['Wellbeing', 'Inclusion', 'Safety', 'Sustainability', 'Compliance'].map((theme) => (
                  <Badge key={theme} variant="outline" className="cursor-pointer bg-muted/50 hover:bg-primary/10">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tone & CTA</Label>
              <Textarea rows={3} placeholder="Supportive tone. CTA: Join the live session or complete the microlearning." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Assets</Label>
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Drag files here or <span className="text-primary font-semibold cursor-pointer">browse</span> to attach playbooks, posters, or slide decks.
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          number="3"
          title="Audience & channels"
          description="Who needs to see this and where should it show up?"
          actionLabel="Next: Review"
          onAction={() => setActiveStep('review')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Audiences</Label>
              <div className="flex flex-wrap gap-2">
                {presetAudiences.map((item) => {
                  const selected = audience.includes(item)
                  return (
                    <Button
                      key={item}
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSelection(audience, item, setAudience)}
                    >
                      {item}
                    </Button>
                  )
                })}
              </div>
              <Input placeholder="Search directories or segments" />
            </div>
            <div className="space-y-3">
              <Label>Channels</Label>
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
                      {ch}
                    </Button>
                  )
                })}
              </div>
              <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Recommended</p>
                </div>
                <p className="text-muted-foreground">
                  Pair email with Slack/Teams to reach both desk and remote workers. Add an intranet banner for persistent visibility.
                </p>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Localization</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Region (e.g., North America)" />
                <Input placeholder="Language (e.g., English, Spanish)" />
                <Input placeholder="Time zone (e.g., PST)" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          number="4"
          title="Schedule & delivery"
          description="Plan cadence, reminders, and follow-ups."
          actionLabel="Save & Review"
          onAction={() => setActiveStep('review')}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cadence</Label>
              <div className="flex flex-wrap gap-2">
                {['Send now', 'Daily microlearning', 'Weekly digest', 'Event-based'].map((item) => (
                  <Badge key={item} variant="outline" className="cursor-pointer bg-muted/50 hover:bg-primary/10">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Follow-ups</Label>
              <Textarea rows={3} placeholder="e.g., Reminder 48h before event, wrap-up with resources" />
            </div>
            <div className="space-y-2">
              <Label>Success signals</Label>
              <Textarea rows={3} placeholder="Target opens/clicks, quiz completion, event attendance, pledge sign-ups" />
            </div>
            <div className="space-y-2">
              <Label>Fallback</Label>
              <Textarea rows={3} placeholder="If no engagement after 5 days, send a brief recap to managers." />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-soft">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Globe2 className="h-4 w-4" />
          Draft saved locally. Publish after review to notify everyone.
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowConfirmExit(true)}>Exit</Button>
          <Button variant="outline" size="sm">Review summary</Button>
          <Button size="sm">
            <Send className="mr-2 h-4 w-4" />
            Publish campaign
          </Button>
        </div>
      </div>

      {showConfirmExit && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Save changes?</p>
                <h3 className="text-lg font-bold">You have unsaved edits</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowConfirmExit(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground">
              <p>Your awareness campaign draft has unsaved updates. Save before leaving to keep your changes.</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <Link href="/campaigns" className="inline-flex">
                <Button variant="outline">Discard and quit</Button>
              </Link>
              <Button onClick={() => setShowConfirmExit(false)}>Save changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type SectionCardProps = {
  number: string
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  children: React.ReactNode
}

function SectionCard({ number, title, description, actionLabel, onAction, children }: SectionCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-soft-lg">
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
          {number}
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </Card>
  )
}
