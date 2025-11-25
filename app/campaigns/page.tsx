import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreVertical } from 'lucide-react'
import Link from 'next/link'

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your awareness campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search campaigns..."
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline">All Status</Button>
            <Button variant="outline">All Categories</Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
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
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const campaigns = [
  {
    id: 1,
    name: 'Mental Health Awareness Week',
    description: 'A week-long campaign to promote mental health awareness and resources.',
    status: 'active',
    date: 'May 1-7, 2024',
    engagement: 42,
    reach: 847,
    channels: ['Slack', 'Email', 'Intranet'],
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
