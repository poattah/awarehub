'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Plug2 } from 'lucide-react'

type Integration = {
  name: string
  category: string
  description: string
  href?: string
}

const integrations: Integration[] = [
  { name: 'Slack', category: 'Collaboration', description: 'Send campaigns, reminders, and polls directly to channels.', href: '/integrations/slack' },
  { name: 'Microsoft Teams', category: 'Collaboration', description: 'Deliver announcements to Teams chats and channels.' },
  { name: 'Outlook', category: 'Email', description: 'Schedule campaign emails with your corporate calendar.' },
  { name: 'Google Workspace', category: 'Email', description: 'Distribute updates to Gmail groups and calendars.' },
  { name: 'Workday', category: 'HRIS', description: 'Sync employee attributes, org data, and groups.' },
  { name: 'BambooHR', category: 'HRIS', description: 'Keep people data aligned for targeting and reporting.' },
  { name: 'UKG Pro', category: 'HRIS', description: 'Automate segment syncing for audiences.' },
  { name: 'Personio', category: 'HRIS', description: 'Import departments, locations, and managers.' },
  { name: 'Okta', category: 'Identity', description: 'SCIM and SSO for secure access and lifecycle management.' },
  { name: 'Azure AD', category: 'Identity', description: 'Provision roles and pull dynamic groups.' },
  { name: 'OneLogin', category: 'Identity', description: 'SSO + SCIM for seamless onboarding.' },
  { name: 'JumpCloud', category: 'Identity', description: 'Directory sync to keep audiences fresh.' },
  { name: 'SendGrid', category: 'Email', description: 'Use your sender domain and analytics.' },
  { name: 'Postmark', category: 'Email', description: 'Reliable transactional delivery for notifications.' },
  { name: 'HubSpot', category: 'CRM', description: 'Sync contacts and report on campaign engagement.' },
  { name: 'Salesforce', category: 'CRM', description: 'Push awareness signals to account and contact records.' },
  { name: 'Zendesk', category: 'Support', description: 'Surface campaigns in help center and macros.' },
  { name: 'Intercom', category: 'Support', description: 'Trigger in-app nudges based on behaviors.' },
  { name: 'ServiceNow', category: 'ITSM', description: 'Publish campaigns to the portal and monitor adoption.' },
  { name: 'Jira', category: 'ITSM', description: 'Automate follow-ups on compliance tasks.' },
  { name: 'Notion', category: 'Intranet', description: 'Embed awareness calendars in team hubs.' },
  { name: 'SharePoint', category: 'Intranet', description: 'Publish posts and banners to sites.' },
  { name: 'Confluence', category: 'Intranet', description: 'Drop updates into pages with rich embeds.' },
  { name: 'Box', category: 'Storage', description: 'Attach files from your content library.' },
  { name: 'Google Drive', category: 'Storage', description: 'Use Drive assets inside templates.' },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Integrations</p>
          <h1 className="text-3xl font-bold tracking-tight">Connect your stack</h1>
          <p className="text-muted-foreground max-w-2xl">
            Streamline awareness workflows by syncing channels, people data, and access. Start with your HRIS and collaboration tools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BookOpen className="mr-2 h-4 w-4" />
            Docs
          </Button>
          <Button size="sm">
            <Plug2 className="mr-2 h-4 w-4" />
            New Integration
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-soft-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="grid gap-6 md:grid-cols-3 p-6">
          <div className="md:col-span-2 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs font-semibold">
              <Plug2 className="h-4 w-4" />
              Featured
            </div>
            <h2 className="text-2xl font-bold">Snappy API — Seamless Gifting</h2>
            <p className="text-muted-foreground max-w-xl">
              Integrate gifting into any workflow. Recognize employees, customers, and prospects without disrupting existing systems.
            </p>
            <div className="flex gap-3">
              <Button size="sm">
                Read API Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                Talk to Solutions
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="h-full rounded-2xl bg-card/60 border border-border/60 flex items-center justify-center text-muted-foreground">
              API diagram
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">HR & Identity</h3>
            <p className="text-sm text-muted-foreground">Automatically manage audiences and permissions.</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations
            .filter((i) => i.category === 'HRIS' || i.category === 'Identity')
            .map((integration) => (
              <IntegrationCard key={integration.name} integration={integration} />
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Channels & Comms</h3>
            <p className="text-sm text-muted-foreground">Push campaigns to where your teams already work.</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations
            .filter((i) => ['Collaboration', 'Email', 'Intranet', 'Storage'].includes(i.category))
            .map((integration) => (
              <IntegrationCard key={integration.name} integration={integration} />
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ops & Support</h3>
            <p className="text-sm text-muted-foreground">Close the loop on compliance, support, and enablement.</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations
            .filter((i) => ['CRM', 'Support', 'ITSM'].includes(i.category))
            .map((integration) => (
              <IntegrationCard key={integration.name} integration={integration} />
            ))}
        </div>
      </div>
    </div>
  )
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const categoryAccent: Record<string, string> = {
    'HRIS': 'text-amber-700 bg-amber-500/10 border-amber-200',
    'Identity': 'text-indigo-700 bg-indigo-500/10 border-indigo-200',
    'Collaboration': 'text-sky-700 bg-sky-500/10 border-sky-200',
    'Email': 'text-emerald-700 bg-emerald-500/10 border-emerald-200',
    'Intranet': 'text-cyan-700 bg-cyan-500/10 border-cyan-200',
    'Storage': 'text-pink-700 bg-pink-500/10 border-pink-200',
    'CRM': 'text-purple-700 bg-purple-500/10 border-purple-200',
    'Support': 'text-rose-700 bg-rose-500/10 border-rose-200',
    'ITSM': 'text-slate-700 bg-slate-500/10 border-slate-200',
  }

  return (
    <Card className="border-border/60 shadow-soft hover:shadow-soft-lg transition-all duration-200">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-semibold">{integration.name}</h4>
            <p className="text-xs text-muted-foreground">{integration.description}</p>
          </div>
          <Badge variant="outline" className={categoryAccent[integration.category] || ''}>
            {integration.category}
          </Badge>
        </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{integration.category} system</span>
          {integration.href ? (
            <Link href={integration.href} className="inline-flex">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm">
              Connect
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
