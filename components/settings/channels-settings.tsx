"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Radio, Loader2, Save, Mail, MessageSquare, Slack, Tv } from "lucide-react"

type Channel = {
  id?: string
  channel_type: string
  is_enabled: boolean
  configuration: Record<string, unknown>
}

const channelDefinitions = [
  {
    type: 'email',
    name: 'Email',
    description: 'Send email notifications using Resend',
    icon: Mail,
    configFields: [
      { key: 'from_email', label: 'From Email', type: 'email', placeholder: 'notifications@example.com' },
      { key: 'from_name', label: 'From Name', type: 'text', placeholder: 'Your Company' }
    ]
  },
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send messages to Slack channels',
    icon: Slack,
    configFields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'default_channel', label: 'Default Channel', type: 'text', placeholder: '#general' }
    ]
  },
  {
    type: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Send messages to Teams channels',
    icon: MessageSquare,
    configFields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://outlook.office.com/webhook/...' }
    ]
  },
  {
    type: 'twilio',
    name: 'SMS (Twilio)',
    description: 'Send SMS messages via Twilio',
    icon: MessageSquare,
    configFields: [
      { key: 'account_sid', label: 'Account SID', type: 'text', placeholder: 'AC...' },
      { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: '••••••••' },
      { key: 'from_number', label: 'From Number', type: 'tel', placeholder: '+1234567890' }
    ]
  },
  {
    type: 'tv_signage',
    name: 'TV Signage',
    description: 'Display on digital signage',
    icon: Tv,
    configFields: [
      { key: 'display_duration', label: 'Display Duration (seconds)', type: 'number', placeholder: '10' }
    ]
  }
]

export function ChannelsSettings() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [configs, setConfigs] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/settings/channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.ok && result.data) {
        setChannels(result.data)

        // Initialize configs from existing channels
        const initialConfigs: Record<string, any> = {}
        channelDefinitions.forEach(def => {
          const existing = result.data.find((c: Channel) => c.channel_type === def.type)
          initialConfigs[def.type] = {
            is_enabled: existing?.is_enabled || false,
            ...existing?.configuration
          }
        })
        setConfigs(initialConfigs)
      }
    } catch (error) {
      console.error('Failed to load channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (channelType: string) => {
    setSaving(channelType)
    setMessage(null)

    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setSaving(null)
        return
      }

      const config = configs[channelType] || {}
      const { is_enabled, ...configuration } = config

      const response = await fetch(`/api/settings/channels/${channelType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_enabled,
          configuration
        })
      })

      const result = await response.json()

      if (result.ok) {
        setMessage({ type: 'success', text: `${channelType} channel saved successfully` })
        fetchChannels()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save channel' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save channel' })
    } finally {
      setSaving(null)
    }
  }

  const updateConfig = (channelType: string, key: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [channelType]: {
        ...prev[channelType],
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="h-5 w-5" />
        <div>
          <h3 className="text-lg font-medium">Communication Channels</h3>
          <p className="text-sm text-muted-foreground">
            Configure the channels for distributing your campaigns
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid gap-6">
        {channelDefinitions.map((channelDef) => {
          const Icon = channelDef.icon
          const config = configs[channelDef.type] || { is_enabled: false }

          return (
            <Card key={channelDef.type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{channelDef.name}</CardTitle>
                      <CardDescription>{channelDef.description}</CardDescription>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.is_enabled}
                      onChange={(e) => updateConfig(channelDef.type, 'is_enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">
                      {config.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </CardHeader>
              {config.is_enabled && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {channelDef.configFields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${channelDef.type}-${field.key}`}>
                          {field.label}
                        </Label>
                        <Input
                          id={`${channelDef.type}-${field.key}`}
                          type={field.type}
                          value={config[field.key] || ''}
                          onChange={(e) => updateConfig(channelDef.type, field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleSave(channelDef.type)}
                    disabled={saving === channelDef.type}
                    className="w-full"
                  >
                    {saving === channelDef.type ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save {channelDef.name} Configuration
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
