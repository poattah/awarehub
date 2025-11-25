'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Send, Slack, Users, Link as LinkIcon } from 'lucide-react'

type Result = { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }

export default function SlackIntegrationPage() {
  const [channelId, setChannelId] = useState('')
  const [userId, setUserId] = useState('')
  const [text, setText] = useState('Hello team — a new awareness campaign is live!')
  const [result, setResult] = useState<Result>({ status: 'idle' })
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      setConnected(true)
    }
  }, [])

  const slackAuthUrl = useMemo(() => {
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/slack/oauth/callback`
    const scope = 'chat:write,chat:write.public,users:read'
    if (!clientId) return '#'
    const url = new URL('https://slack.com/oauth/v2/authorize')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('scope', scope)
    url.searchParams.set('redirect_uri', redirectUri)
    return url.toString()
  }, [])

  const sendMessage = async (target: 'channel' | 'user') => {
    setResult({ status: 'loading' })
    try {
      const targetId = target === 'channel' ? channelId : userId
      const response = await fetch('/api/integrations/slack/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: targetId,
          text,
        }),
      })
      if (!response.ok) throw new Error('Slack API error')
      const data = await response.json()
      if (data.ok) {
        setResult({ status: 'success', message: 'Sent to Slack successfully.' })
      } else {
        setResult({ status: 'error', message: data.error || 'Slack send failed' })
      }
    } catch (err: any) {
      setResult({ status: 'error', message: err.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary font-semibold">Slack integration</p>
          <h1 className="text-3xl font-bold tracking-tight">Send awareness campaigns to Slack</h1>
          <p className="text-muted-foreground">
            Reach individuals or group channels with a single click. Use channel IDs (C123…) or user IDs (U123…).
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="bg-muted/60 text-foreground">DMs and channels</Badge>
            <Badge variant="outline" className="bg-muted/60 text-foreground">Blocks-ready</Badge>
            <Badge variant="outline" className="bg-muted/60 text-foreground">Compliance-friendly</Badge>
            {connected && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Connected</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Slack className="h-10 w-10 text-primary" />
          <a href={slackAuthUrl} className="inline-flex">
            <Button size="sm" variant="outline">
              <LinkIcon className="h-4 w-4 mr-2" />
              {connected ? 'Reconnect' : 'Connect to Slack'}
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-soft-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="font-semibold">Channel send</p>
          </div>
          <div className="space-y-2">
            <Label>Channel ID</Label>
            <Input value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="e.g., C01234567" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <Button onClick={() => sendMessage('channel')}>
            <Send className="mr-2 h-4 w-4" />
            Send to channel
          </Button>
        </Card>

        <Card className="border-border/60 shadow-soft-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="font-semibold">Direct message</p>
          </div>
          <div className="space-y-2">
            <Label>User ID</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g., U01234567" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <Button onClick={() => sendMessage('user')}>
            <Send className="mr-2 h-4 w-4" />
            Send DM
          </Button>
        </Card>

        <Card className="border-border/60 shadow-soft-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <p className="font-semibold">Setup</p>
          </div>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Create a Slack app with chat:write, chat:write.public, and users:read scopes.</li>
            <li>Install to your workspace and copy the Bot User OAuth Token.</li>
            <li>Set `SLACK_BOT_TOKEN` in `.env.local`, restart dev server.</li>
            <li>Use channel IDs (C…) or user IDs (U…).</li>
          </ol>
          {result.status !== 'idle' && (
            <div className={`rounded-xl border px-3 py-2 text-sm ${
              result.status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
              result.status === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
              'border-border/60 bg-muted/50 text-foreground'
            }`}>
              {result.status === 'loading' && 'Sending...'}
              {result.status === 'success' && (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-4 w-4" /> {result.message}
                </span>
              )}
              {result.status === 'error' && result.message}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
