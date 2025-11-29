'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, ExternalLink } from 'lucide-react'

type Project = {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
}

export default function AutomationPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        setError('Not signed in')
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle()
      if (!profile?.organization_id) {
        setError('No organization context')
        setLoading(false)
        return
      }
      setOrgId(profile.organization_id)
      const { data, error } = await supabase
        .from('automation_projects')
        .select('id, name, description, status, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) setError(error.message)
      setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const createProject = async () => {
    if (!orgId || !newName.trim()) return
    const { data, error } = await supabase
      .from('automation_projects')
      .insert({
        organization_id: orgId,
        name: newName.trim(),
        description: newDesc.trim() || null,
        status: 'draft',
      })
      .select('id, name, description, status, created_at')
      .maybeSingle()
    if (error || !data) {
      setError(error?.message || 'Failed to create project')
      return
    }
    setProjects((prev) => [data as Project, ...prev])
    setShowNew(false)
    setNewName('')
    setNewDesc('')
    router.push(`/automation/${data.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
          <p className="text-muted-foreground">
            AI-generated, node-based drip campaigns for awareness programs.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New automation
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="border-border/60 shadow-soft-lg">
        <CardHeader>
          <CardTitle>Automated Drip Campaign Generator</CardTitle>
          <CardDescription>
            Describe your awareness campaign and let the AI build a full, editable workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Node canvas (n8n-style)</Badge>
            <Badge variant="outline">AI content & assets</Badge>
            <Badge variant="outline">Multi-channel</Badge>
            <Badge variant="outline">Timeline & approvals</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The canvas generates emails, Slack/Teams messages, SMS nudges, posters, landing pages,
            quizzes, and scheduling—then you refine with drag-and-drop nodes and AI rewrites.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft-lg">
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Access and manage your automated campaigns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No automation projects yet.</p>
          )}
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description || 'No description'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{p.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/automation/${p.id}`)}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-soft-lg p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">New automation</p>
                <h3 className="text-lg font-bold">Create a project</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowNew(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-2">
              <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Textarea placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={createProject}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
