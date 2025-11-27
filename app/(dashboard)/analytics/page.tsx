import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServerClient } from '@/lib/supabase'
import { ArrowUpRight, Eye, MousePointerClick } from 'lucide-react'

type Rollup = {
  form_id: string
  organization_id: string | null
  views: number
  submissions: number
  submit_errors: number
  builder_saves: number
  conversion_rate: number | null
}

type FormMeta = {
  id: string
  name: string
  kind: string | null
}

async function getRollups() {
  const supabase = createServerClient()
  const { data: rollups } = await supabase
    .from('analytics_form_rollups')
    .select('*')
    .order('submissions', { ascending: false })
    .limit(50)

  const formIds = (rollups || []).map((r: any) => r.form_id)
  const { data: forms } = await supabase
    .from('signup_forms')
    .select('id, name, kind')
    .in('id', formIds.length ? formIds : ['00000000-0000-0000-0000-000000000000'])

  return { rollups: (rollups as Rollup[]) || [], forms: (forms as FormMeta[]) || [] }
}

export default async function AnalyticsPage() {
  const { rollups, forms } = await getRollups()
  const formLookup = new Map(forms.map((f) => [f.id, f]))
  const totals = rollups.reduce(
    (acc, r) => ({
      views: acc.views + (r.views || 0),
      submissions: acc.submissions + (r.submissions || 0),
      submit_errors: acc.submit_errors + (r.submit_errors || 0),
    }),
    { views: 0, submissions: 0, submit_errors: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Form views, submissions, and conversion across signup forms and waitlists.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total submissions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.submissions}</div>
            <p className="text-xs text-muted-foreground">Errors: {totals.submit_errors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg conversion</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rollups.length
                ? `${Math.round(
                    (rollups
                      .map((r) => r.conversion_rate || 0)
                      .reduce((a, b) => a + b, 0) /
                      rollups.length) * 100
                  )}%`
                : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forms</CardTitle>
          <CardDescription>Views, submissions, and conversion by form.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {rollups.map((r) => {
              const meta = formLookup.get(r.form_id)
              return (
                <div key={r.form_id} className="grid grid-cols-[1.6fr,1fr,1fr,1fr] items-center py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{meta?.name || r.form_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta?.kind === 'waitlist' ? 'Waitlist' : 'Signup form'}
                      </p>
                    </div>
                  </div>
                  <div className="text-muted-foreground">Views: {r.views}</div>
                  <div className="text-muted-foreground">Submits: {r.submissions}</div>
                  <div className="text-muted-foreground">
                    Conversion:{' '}
                    {r.conversion_rate === null ? '—' : `${Math.round(r.conversion_rate * 100)}%`}
                  </div>
                </div>
              )
            })}
            {!rollups.length && <p className="text-sm text-muted-foreground py-2">No analytics yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
