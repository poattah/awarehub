'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Filter, Plus, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

const currentYear = new Date().getFullYear()
const toISO = (month: number, day: number) =>
  `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const allowedCategories = [
  'DEI',
  'Heritage',
  'Mental Health',
  'Wellness',
  'Sustainability',
  'Compliance',
  'Safety',
  'Finance',
  'Engagement',
  'Corporate Events',
  'Religious Events',
  'National Events',
  'Social Events',
  'Casual Events',
  'Custom Events',
  'Fun',
  'Other',
] as const

type CalendarEvent = {
  id: number | string
  title: string
  description: string
  date: string // ISO date
  category: (typeof allowedCategories)[number]
  timeRange: string
  source?: 'seeded' | 'calendar' | 'event'
  eventId?: string
}

type ObservanceSeed = {
  title: string
  description: string
  month: number
  day?: number
  category: CalendarEvent['category']
  timeRange?: string
}

const categoryStyles: Record<CalendarEvent['category'], string> = {
  'DEI': 'bg-pink-500/15 text-pink-700 border border-pink-200',
  'Heritage': 'bg-amber-500/15 text-amber-700 border border-amber-200',
  'Mental Health': 'bg-emerald-500/15 text-emerald-700 border border-emerald-200',
  'Wellness': 'bg-sky-500/15 text-sky-700 border border-sky-200',
  'Sustainability': 'bg-lime-500/15 text-lime-700 border border-lime-200',
  'Compliance': 'bg-purple-500/15 text-purple-700 border border-purple-200',
  'Safety': 'bg-orange-500/15 text-orange-700 border border-orange-200',
  'Finance': 'bg-teal-500/15 text-teal-700 border border-teal-200',
  'Engagement': 'bg-blue-500/15 text-blue-700 border border-blue-200',
  'Corporate Events': 'bg-indigo-500/15 text-indigo-700 border border-indigo-200',
  'Religious Events': 'bg-amber-600/15 text-amber-700 border border-amber-200',
  'National Events': 'bg-cyan-500/15 text-cyan-700 border border-cyan-200',
  'Social Events': 'bg-rose-500/15 text-rose-700 border border-rose-200',
  'Casual Events': 'bg-slate-500/15 text-slate-700 border border-slate-200',
  'Custom Events': 'bg-zinc-500/15 text-zinc-700 border border-zinc-200',
  'Fun': 'bg-yellow-500/15 text-yellow-700 border border-yellow-200',
  'Other': 'bg-gray-500/15 text-gray-700 border border-gray-200',
}

const monthObservances: ObservanceSeed[] = [
  { title: 'National Mentoring Month', description: 'Programming to connect mentors and mentees across the org.', month: 1, category: 'Engagement' },
  { title: 'Slavery & Human Trafficking Prevention Month', description: 'Resources and training on prevention and reporting.', month: 1, category: 'Compliance' },
  { title: 'Poverty in America Awareness Month', description: 'Education and volunteer drives supporting local communities.', month: 1, category: 'Heritage' },
  { title: 'National Blood Donor Month', description: 'Blood drive sign-ups and education.', month: 1, category: 'Wellness' },
  { title: 'National Glaucoma Awareness Month', description: 'Eye health screenings and educational content.', month: 1, category: 'Wellness' },
  { title: 'Black History Month', description: 'Spotlighting Black leaders, history, and contributions.', month: 2, category: 'Heritage' },
  { title: 'American Heart Month', description: 'Heart health tips, screenings, and fitness challenges.', month: 2, category: 'Wellness' },
  { title: 'Teen Dating Violence Awareness Month', description: 'Prevention resources and education.', month: 2, category: 'Safety' },
  { title: 'Women’s History Month', description: 'Honoring women’s achievements and allyship.', month: 3, category: 'DEI' },
  { title: 'National Nutrition Month', description: 'Healthy eating challenges and webinars.', month: 3, category: 'Wellness' },
  { title: 'Brain Injury Awareness Month', description: 'Education on brain injury prevention and support.', month: 3, category: 'Wellness' },
  { title: 'Autism Awareness Month', description: 'Understanding neurodiversity and inclusive practices.', month: 4, category: 'DEI' },
  { title: 'Sexual Assault Awareness & Prevention Month', description: 'Training on consent, support, and reporting pathways.', month: 4, category: 'Safety' },
  { title: 'Alcohol Awareness Month', description: 'Resources and support for responsible choices.', month: 4, category: 'Wellness' },
  { title: 'National Financial Literacy Month', description: 'Workshops on budgeting, saving, and investing.', month: 4, category: 'Finance' },
  { title: 'Mental Health Awareness Month', description: 'Programming to reduce stigma and promote support.', month: 5, category: 'Mental Health' },
  { title: 'Older Americans Month', description: 'Celebrating and supporting older colleagues and caregivers.', month: 5, category: 'Heritage' },
  { title: 'Asian/Pacific American Heritage Month', description: 'Stories and cultural programming across APAC heritage.', month: 5, category: 'Heritage' },
  { title: 'Pride Month', description: 'LGBTQ+ inclusion, education, and celebration.', month: 6, category: 'DEI' },
  { title: 'Men’s Health Month', description: 'Preventive care, screenings, and wellbeing tips.', month: 6, category: 'Wellness' },
  { title: 'National Safety Month', description: 'Workplace and personal safety campaigns.', month: 6, category: 'Safety' },
  { title: 'UV Safety Month', description: 'Sun safety education and kits.', month: 7, category: 'Safety' },
  { title: 'National Minority Mental Health Awareness Month', description: 'Culturally responsive mental health resources.', month: 7, category: 'Mental Health' },
  { title: 'National Immunization Awareness Month', description: 'Vaccination education and clinic sign-ups.', month: 8, category: 'Wellness' },
  { title: 'Black Business Month', description: 'Spotlighting Black-owned businesses and suppliers.', month: 8, category: 'DEI' },
  { title: 'National Suicide Prevention Month', description: 'Training and resources to prevent suicide.', month: 9, category: 'Mental Health' },
  { title: 'National Prostate Health Month', description: 'Screening awareness and education.', month: 9, category: 'Wellness' },
  { title: 'National Recovery Month', description: 'Support for recovery journeys and substance-use awareness.', month: 9, category: 'Mental Health' },
  { title: 'Breast Cancer Awareness Month', description: 'Screenings, stories, and donation drives.', month: 10, category: 'Wellness' },
  { title: 'Domestic Violence Awareness Month', description: 'Support resources and bystander training.', month: 10, category: 'Safety' },
  { title: 'LGBT History Month', description: 'Highlighting LGBTQ+ history and contributions.', month: 10, category: 'DEI' },
  { title: 'Lung Cancer Awareness Month', description: 'Education and support resources.', month: 11, category: 'Wellness' },
  { title: 'National Diabetes Month', description: 'Nutrition, movement, and screening awareness.', month: 11, category: 'Wellness' },
  { title: 'Native American Heritage Month', description: 'Celebrating Native and Indigenous cultures.', month: 11, category: 'Heritage' },
  { title: 'National Self-Defense Awareness Month', description: 'Safety workshops and self-defense basics.', month: 1, category: 'Safety' },
  { title: 'Mentoring Month (Alt)', description: 'Alternate naming for National Mentoring Month.', month: 1, category: 'Engagement' },
  { title: 'Multiple Sclerosis Education & Awareness Month', description: 'Education and support for MS awareness.', month: 3, category: 'Wellness' },
  { title: 'National Distracted Driving Awareness Month', description: 'Safe driving campaigns and pledges.', month: 4, category: 'Safety' },
  { title: 'Child Abuse Prevention Month', description: 'Training on prevention and reporting.', month: 4, category: 'Safety' },
  { title: 'Juvenile Arthritis Awareness Month', description: 'Support and education for juvenile arthritis.', month: 7, category: 'Wellness' },
  { title: 'National Breastfeeding Month', description: 'Support for parents and caregivers.', month: 8, category: 'Wellness' },
  { title: 'National Childhood Obesity Awareness Month', description: 'Healthy habits for families and teams.', month: 9, category: 'Wellness' },
  { title: 'National Sickle Cell Awareness Month', description: 'Education and support for sickle cell awareness.', month: 9, category: 'Heritage' },
  { title: 'Hispanic Heritage Month', description: 'Sept 15–Oct 15 cultural observance.', month: 9, category: 'Heritage' },
  { title: 'National Bullying Prevention Month', description: 'Anti-bullying campaigns and resources.', month: 10, category: 'Safety' },
  { title: 'Epilepsy Awareness Month', description: 'Education and support resources.', month: 11, category: 'Wellness' },
  { title: 'Movember (Men’s Health)', description: 'Men’s health and wellbeing campaign.', month: 11, category: 'Wellness' },
  { title: 'Self-Love Month', description: 'Self-care activities and challenges.', month: 1, category: 'Wellness' },
  { title: 'Listening Awareness Month', description: 'Active listening and empathy training.', month: 3, category: 'Engagement' },
  { title: 'Workplace Eye Wellness Month', description: 'Ergonomics and eye health tips.', month: 4, category: 'Wellness' },
  { title: 'Learning Disability Week', description: 'Awareness and inclusion for learning disabilities.', month: 6, category: 'DEI' },
  { title: 'Children’s Eye Health & Safety Month', description: 'Education and screenings for families.', month: 8, category: 'Wellness' },
  { title: 'National Preparedness Month', description: 'Emergency readiness and business continuity.', month: 9, category: 'Safety' },
  { title: 'World Alzheimer’s Month', description: 'Support for caregivers and awareness.', month: 9, category: 'Wellness' },
  { title: 'National Yoga Awareness Month', description: 'Mind-body sessions to reduce stress.', month: 9, category: 'Wellness' },
  { title: 'National Drunk & Drugged Driving Prevention Month', description: 'Safe choices for holiday travel.', month: 12, category: 'Safety' },
  { title: 'Jazz Appreciation Month', description: 'Cultural programming and music spotlights.', month: 4, category: 'Heritage' },
  { title: 'National Park and Recreation Month', description: 'Outdoor activities and wellbeing challenges.', month: 7, category: 'Wellness' },
  { title: 'National Water Quality Month', description: 'Environmental stewardship and water safety.', month: 8, category: 'Sustainability' },
  { title: 'Safe Toys & Gifts Month', description: 'Safety reminders for gifting season.', month: 12, category: 'Safety' },
  { title: 'Irish-American Heritage Month', description: 'Celebrating Irish-American contributions.', month: 3, category: 'Heritage' },
  { title: 'Landscape Architecture Month', description: 'Design appreciation and learning.', month: 4, category: 'Engagement' },
] as const

const dateObservances: ObservanceSeed[] = [
  { title: 'International Holocaust Remembrance Day', description: 'Honoring victims and survivors.', month: 1, day: 27, category: 'Heritage' },
  { title: 'Safer Internet Day', description: 'Cyber hygiene and phishing prevention.', month: 2, day: 11, category: 'Compliance' },
  { title: 'International Women’s Day', description: 'Global celebration of women and gender equity.', month: 3, day: 8, category: 'DEI' },
  { title: 'World Hearing Day', description: 'Hearing health awareness.', month: 3, day: 3, category: 'Wellness' },
  { title: 'World Autism Awareness Day', description: 'Understanding and supporting autism inclusion.', month: 4, day: 2, category: 'DEI' },
  { title: 'Earth Day', description: 'Environmental sustainability and volunteering.', month: 4, day: 22, category: 'Sustainability' },
  { title: 'Siblings Day', description: 'Celebrating sibling relationships.', month: 4, day: 10, category: 'Engagement' },
  { title: 'International Day for the Eradication of Poverty', description: 'Awareness and action on poverty.', month: 10, day: 17, category: 'Heritage' },
  { title: 'World Mental Health Day', description: 'Company-wide mental health focus day.', month: 10, day: 10, category: 'Mental Health' },
  { title: 'World Kindness Day', description: 'Kindness challenges and recognitions.', month: 11, day: 17, category: 'Engagement' },
  { title: 'International Day of Persons with Disabilities', description: 'Accessibility and inclusion programming.', month: 12, day: 3, category: 'DEI' },
  { title: 'Giving Tuesday', description: 'Philanthropy and community impact.', month: 12, day: 3, category: 'Engagement' },
  { title: 'International Nurses Day', description: 'Celebrating nurses and healthcare professionals.', month: 5, day: 12, category: 'Wellness' },
  { title: 'World Blood Donor Day', description: 'Blood donation awareness.', month: 6, day: 14, category: 'Wellness' },
  { title: 'Juneteenth National Independence Day', description: 'Honoring emancipation and Black freedom.', month: 6, day: 19, category: 'Heritage' },
  { title: 'Women’s Equality Day', description: 'Gender equity and allyship.', month: 8, day: 26, category: 'DEI' },
  { title: 'HR Professionals Day', description: 'Appreciation for HR teams.', month: 9, day: 26, category: 'Engagement' },
  { title: 'World Suicide Prevention Day', description: 'Suicide prevention training and resources.', month: 9, day: 10, category: 'Mental Health' },
  { title: 'International Day of Peace', description: 'Programming on peace and conflict resolution.', month: 9, day: 21, category: 'Engagement' },
  { title: 'Get Smart About Credit Day', description: 'Credit education and coaching.', month: 10, day: 16, category: 'Finance' },
  { title: 'National Retirement Security Week', description: 'Retirement planning education.', month: 10, day: 16, category: 'Finance', timeRange: 'Week-long' },
  { title: 'Make a Difference Day', description: 'Volunteer and service projects.', month: 10, day: 25, category: 'Engagement' },
  { title: 'Global Entrepreneurship Week', description: 'Innovation and entrepreneurship events.', month: 11, day: 18, category: 'Engagement', timeRange: 'Week-long' },
  { title: 'Transgender Day of Remembrance', description: 'Honoring trans lives lost to violence.', month: 11, day: 20, category: 'DEI' },
  { title: 'Project Management Day', description: 'Celebrate PMs and best practices.', month: 11, day: 6, category: 'Engagement' },
  { title: 'International Accounting Day', description: 'Appreciation for finance teams.', month: 11, day: 10, category: 'Finance' },
  { title: 'National Wildlife Conservation Day', description: 'Wildlife and conservation awareness.', month: 12, day: 4, category: 'Sustainability' },
  { title: 'National Selfie Day', description: 'Fun engagement photo challenge.', month: 6, day: 21, category: 'Engagement' },
  { title: 'World Oceans Day', description: 'Marine conservation focus.', month: 6, day: 8, category: 'Sustainability' },
  { title: 'Memorial Day', description: 'Honoring those who served.', month: 5, day: 26, category: 'Heritage' },
  { title: 'National Cancer Survivor’s Day', description: 'Celebrating survivorship and support.', month: 6, day: 1, category: 'Wellness' },
  { title: 'World Population Day', description: 'Awareness of global population challenges.', month: 7, day: 11, category: 'Engagement' },
  { title: 'National Grief Awareness Day', description: 'Support and resources for grief.', month: 8, day: 30, category: 'Mental Health' },
  { title: 'Alice Day of Non-Violence', description: 'Commemorating victims of religion-based violence.', month: 8, day: 30, category: 'Safety' },
  { title: 'National 401(k) Day', description: 'Retirement savings education.', month: 9, day: 1, category: 'Finance' },
  { title: 'World Vegan Day', description: 'Plant-based food education and tastings.', month: 11, day: 1, category: 'Wellness' },
  { title: 'National Nonprofit Day', description: 'Celebrating nonprofit partners and impact.', month: 8, day: 17, category: 'Engagement' },
  { title: 'National Inclusion Week (third week of Oct)', description: 'Inclusion programming across teams.', month: 10, day: 21, category: 'DEI', timeRange: 'Week-long' },
  { title: 'Eating Disorders Awareness Week', description: 'Awareness and support resources.', month: 2, day: 24, category: 'Mental Health', timeRange: 'Week-long' },
  { title: 'Teacher Appreciation Week (first full week of May)', description: 'Celebrating educators in our network.', month: 5, day: 6, category: 'Engagement', timeRange: 'Week-long' },
  { title: 'Learning Disability Week', description: 'Inclusion for learning disabilities.', month: 6, day: 17, category: 'DEI', timeRange: 'Week-long' },
] as const

const seededEvents: CalendarEvent[] = [
  ...monthObservances,
  ...dateObservances,
].map((seed, index) => ({
  id: index + 1,
  title: seed.title,
  description: seed.description,
  date: toISO(seed.month, seed.day ?? 1),
  category: seed.category,
  timeRange: seed.timeRange ?? (seed.day ? 'All day' : 'All month'),
}))

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Engagement' as CalendarEvent['category'],
    timeRange: 'All day',
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const router = useRouter()

  const allEvents = useMemo(() => [...seededEvents, ...userEvents], [userEvents])

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const eventsByDate = useMemo(() => {
    const filtered = categoryFilter === 'all'
      ? allEvents
      : allEvents.filter((event) => event.category === categoryFilter)
    return filtered.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const key = format(parseISO(event.date), 'yyyy-MM-dd')
      acc[key] = acc[key] ? [...acc[key], event] : [event]
      return acc
    }, {})
  }, [allEvents, categoryFilter])

  useEffect(() => {
    const loadOrg = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return
      const { data } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle()
      const orgIdFromProfile = (data as any)?.organization_id as string | null
      if (orgIdFromProfile) setOrgId(orgIdFromProfile)
    }
    loadOrg()
  }, [])

  useEffect(() => {
    const loadRemoteEvents = async () => {
      if (!orgId) return
      setLoadingRemote(true)
      const [calRes, orgRes] = await Promise.all([
        (supabase as any)
          .from('calendar_events')
          .select('id, title, description, category, start_date')
          .eq('organization_id', orgId)
          .order('start_date', { ascending: true })
          .limit(200),
        supabase
          .from('events')
          .select('id, name, description, start_at')
          .eq('organization_id', orgId)
          .order('start_at', { ascending: true })
          .limit(200),
      ])
      setLoadingRemote(false)
      const mappedCal: CalendarEvent[] = (calRes.data || []).map((e: any) => {
        const cat = allowedCategories.includes(e.category) ? e.category : 'Other'
        return {
          id: e.id,
          title: e.title,
          description: e.description || '',
          date: e.start_date,
          category: cat,
          timeRange: 'All day',
          source: 'calendar',
        }
      })
      const mappedOrg: CalendarEvent[] = (orgRes.data || []).map((e: any) => ({
        id: e.id,
        title: e.name,
        description: e.description || '',
        date: e.start_at,
        category: allowedCategories.includes('Corporate Events') ? 'Corporate Events' : 'Other',
        timeRange: 'All day',
        source: 'event',
        eventId: e.id,
      }))
      setUserEvents([...mappedCal, ...mappedOrg])
    }
    loadRemoteEvents()
  }, [orgId])

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (!orgId) {
      alert('No organization context; please sign in again.')
      return
    }

    const safeCategory = allowedCategories.includes(form.category) ? form.category : 'Other'

    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim() || 'User-added event',
      date: form.date,
      category: safeCategory,
      timeRange: form.timeRange || 'All day',
    }

    const { error } = await (supabase as any)
      .from('calendar_events')
      .insert({
        title: newEvent.title,
        description: newEvent.description,
        category: safeCategory,
        start_date: newEvent.date,
        organization_id: orgId,
      })
    if (error) {
      alert(error.message)
      return
    }

    setUserEvents((prev) => [...prev, newEvent])
    setForm((prev) => ({
      ...prev,
      title: '',
      description: '',
      timeRange: 'All day',
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Awareness Calendar</h1>
            <p className="text-muted-foreground">
              100+ corporate observances preloaded. Add your own moments and keep everything in one view.
            </p>
          </div>
          <div className="flex items-center gap-2 relative">
            <Button variant="outline" size="sm" onClick={() => setCategoryMenuOpen((o) => !o)}>
              <Filter className="mr-2 h-4 w-4" />
              {categoryFilter === 'all' ? 'All categories' : categoryFilter}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
            {categoryMenuOpen && (
              <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-border/70 bg-card shadow-soft-lg p-1">
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm"
                  onClick={() => {
                    setCategoryFilter('all')
                    setCategoryMenuOpen(false)
                  }}
                >
                  All categories
                </button>
                {allowedCategories.map((cat) => (
                  <button
                    key={cat}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm"
                    onClick={() => {
                      setCategoryFilter(cat)
                      setCategoryMenuOpen(false)
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-3"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-3"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-2"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/70 bg-card/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Add a moment</p>
              <p className="text-xs text-muted-foreground">Open the modal to capture a new observance or team event.</p>
            </div>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New event
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-border/60 shadow-soft-lg">
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {daysOfWeek.map((day) => (
            <div key={day} className="px-4 py-3">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[key] || []
            const inCurrentMonth = isSameMonth(day, currentMonth)
            return (
              <div
                key={key}
                className={`min-h-[140px] border-r border-b border-border/40 p-3 transition hover:bg-muted/40 ${!inCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isToday(day) && (
                    <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">Today</span>
                  )}
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-xs shadow-sm transition hover:scale-[1.01] ${categoryStyles[event.category]}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold leading-tight">{event.title}</span>
                        <span className="text-[10px] uppercase tracking-wide opacity-70">{event.category}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-tight opacity-80 line-clamp-2">{event.description}</p>
                      <p className="mt-1 text-[11px] font-medium">{event.timeRange}</p>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setSelectedEvent(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-soft-lg p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Event actions</p>
                <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                <p className="text-sm text-muted-foreground">{format(parseISO(selectedEvent.date), 'PPPP')}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={() => {
                  router.push(`/campaigns?seed=${encodeURIComponent(selectedEvent.title)}`)
                  setSelectedEvent(null)
                }}
              >
                Start campaign from this date
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                disabled={selectedEvent.source !== 'event' || !selectedEvent.eventId}
                onClick={() => {
                  if (selectedEvent.source === 'event' && selectedEvent.eventId) {
                    window.open(`/events/${selectedEvent.eventId}`, '_blank')
                    setSelectedEvent(null)
                  }
                }}
              >
                View event page
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  alert('Notify list coming soon')
                  setSelectedEvent(null)
                }}
              >
                Notify list about this event
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-2xl border border-border/80 bg-card shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">Add a moment</p>
                <h3 className="text-lg font-bold">Create calendar entry</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form className="space-y-4 px-5 py-4" onSubmit={(e) => { handleAddEvent(e); setIsModalOpen(false) }}>
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Team Giving Day"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as CalendarEvent['category'] }))}
                  >
                    {allowedCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="timerange">Time / Note</Label>
                <Input
                  id="timerange"
                  value={form.timeRange}
                  onChange={(e) => setForm((prev) => ({ ...prev, timeRange: e.target.value }))}
                  placeholder="All day or 10:00 - 12:00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What should people know?"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to calendar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
