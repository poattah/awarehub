import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Layout } from 'lucide-react'

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            50+ professionally designed templates for your campaigns
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Template
          </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search templates..."
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline">All Types</Button>
            <Button variant="outline">All Categories</Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {templateTypes.map((type) => (
          <Card key={type.name} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Layout className="h-8 w-8 text-primary" />
                <Badge variant="outline">{type.count}</Badge>
              </div>
              <CardTitle className="text-lg">{type.name}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Template Gallery */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Popular Templates</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="p-0">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                  <Layout className="h-16 w-16 text-primary/40" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.category}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.type}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">Use Template</Button>
                    <Button size="sm" variant="outline">Preview</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

const templateTypes = [
  { name: 'Email', description: 'Announcement emails', count: 15 },
  { name: 'Slack Cards', description: 'Interactive messages', count: 12 },
  { name: 'Posters', description: 'Digital signage', count: 18 },
  { name: 'Social Cards', description: 'Share-ready graphics', count: 10 },
]

const templates = [
  { id: 1, name: 'Pride Month Announcement', category: 'DEI', type: 'Email' },
  { id: 2, name: 'Mental Health Resources', category: 'Wellness', type: 'Slack' },
  { id: 3, name: 'Earth Day Challenge', category: 'Sustainability', type: 'Poster' },
  { id: 4, name: 'Women\'s History Month', category: 'Heritage', type: 'Email' },
  { id: 5, name: 'Wellness Week Kickoff', category: 'Wellness', type: 'Slack' },
  { id: 6, name: 'Black History Month', category: 'Heritage', type: 'Poster' },
]
