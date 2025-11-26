"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Users, Loader2, Trash2, Shield } from "lucide-react"

type TeamMember = {
  id: string
  email: string
  full_name: string | null
  role: 'org_admin' | 'campaign_admin' | 'editor' | 'viewer'
  avatar_url: string | null
  last_login_at: string | null
  created_at: string
}

export function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/settings/team', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.ok && result.data) {
        setMembers(result.data)
      }
    } catch (error) {
      console.error('Failed to load team:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    setMessage(null)

    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        return
      }

      const response = await fetch(`/api/settings/team/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      const result = await response.json()

      if (result.ok) {
        setMessage({ type: 'success', text: 'Role updated successfully' })
        fetchTeam()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update role' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update role' })
    }
  }

  const removeMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName || 'this member'} from the team?`)) {
      return
    }

    setMessage(null)

    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        return
      }

      const response = await fetch(`/api/settings/team/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.ok) {
        setMessage({ type: 'success', text: 'Team member removed successfully' })
        fetchTeam()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove member' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove member' })
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'org_admin':
        return 'default'
      case 'campaign_admin':
        return 'default'
      case 'editor':
        return 'default'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'org_admin':
        return 'Admin'
      case 'campaign_admin':
        return 'Campaign Admin'
      case 'editor':
        return 'Editor'
      case 'viewer':
        return 'Viewer'
      default:
        return role
    }
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <CardDescription>
            Manage your team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No team members found
              </p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.full_name || member.email}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Select
                      value={member.role}
                      onChange={(e) => updateRole(member.id, e.target.value)}
                      className="w-40"
                    >
                      <option value="org_admin">Admin</option>
                      <option value="campaign_admin">Campaign Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(member.id, member.full_name || member.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Role Permissions:</p>
                <ul className="space-y-1">
                  <li><span className="font-medium">Admin:</span> Full access to all settings and features</li>
                  <li><span className="font-medium">Campaign Admin:</span> Can create and manage campaigns</li>
                  <li><span className="font-medium">Editor:</span> Can edit campaigns and content</li>
                  <li><span className="font-medium">Viewer:</span> Read-only access</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
