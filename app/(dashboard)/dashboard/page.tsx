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
        <Card className="group cursor-pointer hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Megaphone className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-green-600">↑ +2</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="group cursor-pointer hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Calendar className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
        <Card className="group cursor-pointer hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <TrendingUp className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-green-600">↑ +5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="group cursor-pointer hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Users className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
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
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.date}</p>
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
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-soft transition-all">
                    <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
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
              <div className="group flex flex-col items-center space-y-3 rounded-2xl border border-border/60 p-6 hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-soft-lg">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-soft transition-all">
                  <Megaphone className="h-6 w-6 text-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all" />
                </div>
                <p className="text-sm font-medium">Create Campaign</p>
              </div>
            </Link>
            <Link href="/calendar">
              <div className="group flex flex-col items-center space-y-3 rounded-2xl border border-border/60 p-6 hover:bg-blue-500/5 hover:border-blue-500/30 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-soft-lg">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:shadow-soft transition-all">
                  <Calendar className="h-6 w-6 text-blue-600 group-hover:text-white group-hover:scale-110 transition-all" />
                </div>
                <p className="text-sm font-medium">View Calendar</p>
              </div>
            </Link>
            <Link href="/templates">
              <div className="group flex flex-col items-center space-y-3 rounded-2xl border border-border/60 p-6 hover:bg-purple-500/5 hover:border-purple-500/30 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-soft-lg">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:shadow-soft transition-all">
                  <Plus className="h-6 w-6 text-purple-600 group-hover:text-white group-hover:scale-110 transition-all" />
                </div>
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
