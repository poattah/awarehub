import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Filter } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Awareness Calendar</h1>
          <p className="text-muted-foreground">
            365+ global awareness days and custom events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Event
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category} variant="outline" className="cursor-pointer hover:bg-accent">
            {category}
          </Badge>
        ))}
      </div>

      {/* Calendar Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {calendarEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant={getCategoryVariant(event.category)}>
                  {event.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{event.date}</span>
              </div>
              <CardTitle className="text-lg">{event.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const categories = ['DEI', 'Wellness', 'Mental Health', 'Sustainability', 'Heritage', 'Fun', 'Compliance']

const calendarEvents = [
  {
    id: 1,
    name: 'International Women\'s Day',
    date: 'March 8',
    category: 'DEI',
    description: 'Celebrate the social, economic, cultural, and political achievements of women.',
  },
  {
    id: 2,
    name: 'World Mental Health Day',
    date: 'October 10',
    category: 'Mental Health',
    description: 'Raise awareness of mental health issues around the world.',
  },
  {
    id: 3,
    name: 'Earth Day',
    date: 'April 22',
    category: 'Sustainability',
    description: 'Demonstrate support for environmental protection.',
  },
  {
    id: 4,
    name: 'Pride Month',
    date: 'June 1-30',
    category: 'DEI',
    description: 'Celebrate LGBTQ+ pride and the impact of LGBTQ+ individuals.',
  },
  {
    id: 5,
    name: 'Black History Month',
    date: 'February',
    category: 'Heritage',
    description: 'Celebrate the achievements of Black Americans.',
  },
  {
    id: 6,
    name: 'Mental Health Awareness Month',
    date: 'May',
    category: 'Mental Health',
    description: 'Raise awareness and educate the public about mental health.',
  },
]

function getCategoryVariant(category: string): 'default' | 'secondary' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    'DEI': 'default',
    'Mental Health': 'secondary',
    'Sustainability': 'outline',
    'Heritage': 'default',
  }
  return variants[category] || 'outline'
}
