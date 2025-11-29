'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Trash2,
  Save,
  Wand2,
  Link as LinkIcon,
  MousePointer2,
  Mail,
  Bell,
  MessageSquare,
  PhoneCall,
} from 'lucide-react'

type Node = {
  id: string
  type: string
  label: string | null
  data: any
  position: { x: number; y: number }
}
type Edge = {
  id: string
  source: string
  target: string
  label?: string
}

export default function AutomationCanvasPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connectMode, setConnectMode] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [aiPrompt, setAiPrompt] = useState('Run a 3-week Cybersecurity Awareness drip')
  const [flyout, setFlyout] = useState<{ nodeId: string; x: number; y: number } | null>(null)

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
      const org = (profile as any)?.organization_id as string | null
      if (!org) {
        setError('No organization context')
        setLoading(false)
        return
      }
      setOrgId(org)
      const [projRes, nodeRes, edgeRes] = await Promise.all([
        supabase.from('automation_projects').select('*').eq('id', id).eq('organization_id', org).maybeSingle(),
        supabase.from('automation_nodes').select('*').eq('project_id', id).eq('organization_id', org),
        supabase.from('automation_edges').select('*').eq('project_id', id).eq('organization_id', org),
      ])
      const proj: any = projRes.data
      if (projRes.error || !proj) {
        setError('Project not found')
        setLoading(false)
        return
      }
      setProjectName(proj.name || '')
      setProjectDesc(proj.description || '')
      setNodes(
        (nodeRes.data || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          data: n.data,
          position: n.position || { x: 120, y: 120 },
        }))
      )
      setEdges(
        (edgeRes.data || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
        }))
      )
      setLoading(false)
    }
    load()
  }, [id])

  const nodePalette = useMemo(
    () => [
      { type: 'start', label: 'Start' },
      { type: 'content', label: 'Content' },
      { type: 'email', label: 'Email' },
      { type: 'slack', label: 'Slack/Teams' },
      { type: 'sms', label: 'SMS' },
      { type: 'wait', label: 'Wait/Delay' },
      { type: 'condition', label: 'Condition' },
      { type: 'landing', label: 'Landing page' },
      { type: 'quiz', label: 'Quiz' },
      { type: 'list', label: 'Contact list/segment' },
      { type: 'publish', label: 'Publish' },
    ],
    []
  )

  const addNode = (type: string) => {
    const newId = crypto.randomUUID()
    const baseX = 120 + pan.x
    const baseY = 120 + pan.y
    setNodes((prev) => [
      ...prev,
      {
        id: newId,
        type,
        label: `${type} node`,
        data: {},
        position: { x: baseX + prev.length * 40, y: baseY + prev.length * 20 },
      },
    ])
  }

  const saveAll = async () => {
    if (!orgId) return
    setSaving(true)
    setError(null)
    const client = supabase as any
    const { error: projErr } = await client
      .from('automation_projects')
      .update({ name: projectName, description: projectDesc } as any)
      .eq('id', id)
      .eq('organization_id', orgId)
    if (projErr) {
      setError(projErr.message)
      setSaving(false)
      return
    }
    await client.from('automation_edges').delete().eq('project_id', id).eq('organization_id', orgId)
    await client.from('automation_nodes').delete().eq('project_id', id).eq('organization_id', orgId)
    if (nodes.length) {
      await client.from('automation_nodes').insert(
        nodes.map((n) => ({
          id: n.id,
          project_id: id,
          organization_id: orgId,
          type: n.type,
          label: n.label,
          data: n.data,
          position: n.position,
        }))
      )
    }
    if (edges.length) {
      await client.from('automation_edges').insert(
        edges.map((e) => ({
          id: e.id,
          project_id: id,
          organization_id: orgId,
          source: e.source,
          target: e.target,
          label: e.label,
        }))
      )
    }
    setSaving(false)
  }

  const seedFlow = () => {
    const startId = crypto.randomUUID()
    const emailId = crypto.randomUUID()
    const slackId = crypto.randomUUID()
    const waitId = crypto.randomUUID()
    setNodes([
      { id: startId, type: 'start', label: 'Campaign brief', data: { prompt: 'Awareness campaign' }, position: { x: 120, y: 160 } },
      { id: emailId, type: 'email', label: 'Email 1', data: { subject: 'Kickoff', body: 'Welcome to the campaign.' }, position: { x: 380, y: 120 } },
      { id: slackId, type: 'slack', label: 'Slack nudge', data: { message: 'Reminder in Slack.' }, position: { x: 380, y: 260 } },
      { id: waitId, type: 'wait', label: 'Wait 2 days', data: { duration: '2d' }, position: { x: 620, y: 200 } },
    ])
    setEdges([
      { id: crypto.randomUUID(), source: startId, target: emailId, label: 'Generate email' },
      { id: crypto.randomUUID(), source: startId, target: slackId, label: 'Generate Slack' },
      { id: crypto.randomUUID(), source: emailId, target: waitId, label: 'Delay' },
    ])
  }

  const aiGenerate = async () => {
    setSaving(true)
    setError(null)
    try {
      const resp = await fetch('/api/internal/automation-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (!resp.ok) throw new Error('Generate failed')
      const json = await resp.json()
      setNodes(json.nodes || [])
      setEdges(json.edges || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to generate flow')
    } finally {
      setSaving(false)
    }
  }

  const addChannelNode = (parentId: string, type: 'email' | 'sms' | 'push' | 'whatsapp') => {
    const newId = crypto.randomUUID()
    const parent = nodes.find((n) => n.id === parentId)
    const baseX = (parent?.position.x || 200) + 220
    const baseY = (parent?.position.y || 200) + 60
    const label = {
      email: 'Email',
      sms: 'SMS',
      push: 'Push notification',
      whatsapp: 'WhatsApp',
    }[type]
    setNodes((prev) => [
      ...prev,
      {
        id: newId,
        type,
        label,
        data: { content: `${label} message` },
        position: { x: baseX, y: baseY },
      },
    ])
    setEdges((prev) => [...prev, { id: crypto.randomUUID(), source: parentId, target: newId, label: 'Channel' }])
    setFlyout(null)
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col flex-1">
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
            />
            <Textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={2}
              className="border-none px-0 text-sm text-muted-foreground focus-visible:ring-0"
              placeholder="Add a brief for AI generation"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedFlow}>
              <Wand2 className="mr-2 h-4 w-4" />
              Seed flow
            </Button>
            <Button onClick={saveAll} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe the campaign (e.g., 4-week Cybersecurity Awareness)"
          />
          <Button onClick={aiGenerate}>Generate with AI (stub)</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[260px,1fr,280px]">
        <Card className="border-border/60">
          <div className="p-3 space-y-2">
            <p className="text-sm font-semibold">Node palette</p>
            <div className="grid grid-cols-2 gap-2">
              {nodePalette.map((n) => (
                <Button key={n.type} variant="outline" size="sm" onClick={() => addNode(n.type)}>
                  {n.label}
                </Button>
              ))}
            </div>
            <p className="text-sm font-semibold pt-2">Edges</p>
            <p className="text-xs text-muted-foreground">Tap Connect, click a source then a target.</p>
            <Button
              variant={connectMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setConnectMode((p) => !p)
                setSelectedNode(null)
              }}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {connectMode ? 'Connecting…' : 'Connect'}
            </Button>
            <p className="text-sm font-semibold pt-2">Pan & zoom</p>
            <p className="text-xs text-muted-foreground">Drag empty space to pan, scroll to zoom.</p>
          </div>
        </Card>

        <Card className="border-border/60 h-[70vh] overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Canvas</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPan({ x: 0, y: 0 })
                setScale(1)
              }}
            >
              <MousePointer2 className="mr-2 h-4 w-4" />
              Reset view
            </Button>
          </div>
          <div
            ref={canvasRef}
            className="relative h-[520px] bg-muted/20 overflow-hidden"
            onWheel={(e) => {
              e.preventDefault()
              const next = Math.min(2, Math.max(0.5, scale - e.deltaY * 0.001))
              setScale(next)
            }}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).dataset.node) return
              const startX = e.clientX
              const startY = e.clientY
              const startPan = { ...pan }
              const move = (ev: MouseEvent) => {
                setPan({ x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) })
              }
              const up = () => {
                window.removeEventListener('mousemove', move)
                window.removeEventListener('mouseup', up)
              }
              window.addEventListener('mousemove', move)
              window.addEventListener('mouseup', up)
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                backgroundSize: '24px 24px',
                backgroundImage:
                  'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
              }}
              onClick={() => {
                if (flyout) setFlyout(null)
              }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {edges.map((e) => {
                  const src = nodes.find((n) => n.id === e.source)
                  const tgt = nodes.find((n) => n.id === e.target)
                  if (!src || !tgt) return null
                  const sx = (src.position?.x || 0) + 120
                  const sy = (src.position?.y || 0) + 40
                  const tx = (tgt.position?.x || 0) + 120
                  const ty = (tgt.position?.y || 0) + 40
                  const mx = (sx + tx) / 2
                  const my = (sy + ty) / 2
                  return (
                    <g key={e.id}>
                      <path
                        d={`M${sx},${sy} Q${mx},${sy} ${mx},${my} T${tx},${ty}`}
                        fill="none"
                        stroke="rgba(59,130,246,0.6)"
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                      />
                      {e.label && (
                        <text x={mx} y={my - 6} textAnchor="middle" fontSize="10" fill="#334155">
                          {e.label}
                        </text>
                      )}
                    </g>
                  )
                })}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(59,130,246,0.6)" />
                  </marker>
                </defs>
              </svg>

              {nodes.map((n) => (
                <div
                  key={n.id}
                  data-node
                  className={`absolute rounded-xl border ${
                    selectedNode === n.id ? 'border-primary' : 'border-border/60'
                  } bg-card shadow-sm p-3 w-64 space-y-2 cursor-grab active:cursor-grabbing`}
                  style={{ left: n.position.x, top: n.position.y }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setSelectedNode(n.id)
                    const startX = e.clientX
                    const startY = e.clientY
                    const startPos = { ...n.position }
                    const move = (ev: MouseEvent) => {
                      setNodes((prev) =>
                        prev.map((x) =>
                          x.id === n.id
                            ? {
                                ...x,
                                position: {
                                  x: startPos.x + (ev.clientX - startX) / scale,
                                  y: startPos.y + (ev.clientY - startY) / scale,
                                },
                              }
                            : x
                        )
                      )
                    }
                    const up = () => {
                      window.removeEventListener('mousemove', move)
                      window.removeEventListener('mouseup', up)
                    }
                    window.addEventListener('mousemove', move)
                    window.addEventListener('mouseup', up)
                  }}
                  onClick={() => {
                    if (connectMode && selectedNode && selectedNode !== n.id) {
                      setEdges((prev) => [...prev, { id: crypto.randomUUID(), source: selectedNode, target: n.id }])
                      setConnectMode(false)
                    } else {
                      setSelectedNode(n.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{n.label || n.type}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFlyout({ nodeId: n.id, x: e.clientX, y: e.clientY })
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setNodes((prev) => prev.filter((x) => x.id !== n.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] uppercase text-muted-foreground">{n.type}</div>
                  <Textarea
                    value={n.data?.content || ''}
                    onChange={(e) =>
                      setNodes((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, data: { ...x.data, content: e.target.value } } : x))
                      )
                    }
                    rows={3}
                    className="text-sm"
                    placeholder="Content / prompt"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-border/60">
          <div className="p-3 space-y-3">
            <p className="text-sm font-semibold">Inspector</p>
            {selectedNode ? (
              <>
                <p className="text-xs text-muted-foreground">ID: {selectedNode}</p>
                <Input
                  value={nodes.find((n) => n.id === selectedNode)?.label || ''}
                  onChange={(e) =>
                    setNodes((prev) => prev.map((x) => (x.id === selectedNode ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Label"
                />
                <Textarea
                  value={nodes.find((n) => n.id === selectedNode)?.data?.content || ''}
                  onChange={(e) =>
                    setNodes((prev) =>
                      prev.map((x) =>
                        x.id === selectedNode ? { ...x, data: { ...x.data, content: e.target.value } } : x
                      )
                    )
                  }
                  rows={6}
                  placeholder="Content / prompt"
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Select a node to edit.</p>
            )}
          </div>
        </Card>
      </div>

      {flyout && (
        <div
          className="fixed z-[9999] rounded-xl border border-border/70 bg-card shadow-soft-lg p-2 space-y-1"
          style={{ top: flyout.y + 8, left: flyout.x + 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold px-2">Channel Selection</p>
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addChannelNode(flyout.nodeId, 'email')}>
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addChannelNode(flyout.nodeId, 'sms')}>
              <MessageSquare className="h-4 w-4 mr-2" /> SMS
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addChannelNode(flyout.nodeId, 'push')}>
              <Bell className="h-4 w-4 mr-2" /> Push notification
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => addChannelNode(flyout.nodeId, 'whatsapp')}>
              <PhoneCall className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setFlyout(null)}>
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
