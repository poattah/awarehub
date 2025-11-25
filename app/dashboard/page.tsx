import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Megaphone, TrendingUp, Users, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your awareness campaigns.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              Employees reached
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Your latest awareness initiatives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">{campaign.date}</p>
                  </div>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Awareness Days</CardTitle>
            <CardDescription>Important dates to consider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/campaigns/new">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 hover:bg-accent cursor-pointer transition-colors">
                <Megaphone className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">Create Campaign</p>
              </div>
            </Link>
            <Link href="/calendar">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 hover:bg-accent cursor-pointer transition-colors">
                <Calendar className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">View Calendar</p>
              </div>
            </Link>
            <Link href="/templates">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 hover:bg-accent cursor-pointer transition-colors">
                <Plus className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">Browse Templates</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const recentCampaigns = [
  { id: 1, name: 'Mental Health Awareness Week', date: 'May 1-7, 2024', status: 'active' },
  { id: 2, name: 'Pride Month Celebration', date: 'June 2024', status: 'scheduled' },
  { id: 3, name: 'Earth Day Initiative', date: 'April 22, 2024', status: 'completed' },
]

const upcomingEvents = [
  { id: 1, name: 'World Mental Health Day', date: 'October 10, 2024' },
  { id: 2, name: 'International Women\'s Day', date: 'March 8, 2025' },
  { id: 3, name: 'Black History Month', date: 'February 2025' },
]
