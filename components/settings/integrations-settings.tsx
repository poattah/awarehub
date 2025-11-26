"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plug, Loader2, CheckCircle2, Circle } from "lucide-react"

type Integration = {
  type: string
  name: string
  description: string
  icon: string
  isConnected: boolean
  configuration: Record<string, unknown>
}

export function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/settings/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.ok && result.data) {
        setIntegrations(result.data)
      }
    } catch (error) {
      console.error('Failed to load integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIntegrationIcon = (iconName: string) => {
    // Return appropriate icon based on name
    // For simplicity, using Plug for all
    return Plug
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
        <Plug className="h-5 w-5" />
        <div>
          <h3 className="text-lg font-medium">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect third-party services to enhance your campaigns
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid gap-4">
        {integrations.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground text-center">
                No integrations available
              </p>
            </CardContent>
          </Card>
        ) : (
          integrations.map((integration) => {
            const Icon = getIntegrationIcon(integration.icon)

            return (
              <Card key={integration.type}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{integration.name}</CardTitle>
                          {integration.isConnected ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Circle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>

                    <Button
                      variant={integration.isConnected ? "outline" : "default"}
                      onClick={() => {
                        // Redirect to channel settings for configuration
                        setMessage({
                          type: 'success',
                          text: 'Please configure this integration in the Channels tab'
                        })
                      }}
                    >
                      {integration.isConnected ? 'Manage' : 'Connect'}
                    </Button>
                  </div>
                </CardHeader>

                {integration.isConnected && Object.keys(integration.configuration).length > 0 && (
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Configuration:</p>
                      <div className="p-3 bg-muted rounded-lg">
                        {Object.entries(integration.configuration).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-mono text-xs">
                              {typeof value === 'string' && value.length > 30
                                ? `${value.substring(0, 30)}...`
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <Plug className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Need a custom integration? Contact support for enterprise solutions.
            </p>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
