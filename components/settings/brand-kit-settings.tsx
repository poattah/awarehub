"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Palette, Save, Loader2 } from "lucide-react"

type BrandKitData = {
  id?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  heading_font?: string
  body_font?: string
  logo_url?: string
}

export function BrandKitSettings() {
  const [data, setData] = useState<BrandKitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    accent_color: "#F59E0B",
    heading_font: "Inter",
    body_font: "Inter"
  })

  useEffect(() => {
    fetchBrandKit()
  }, [])

  const fetchBrandKit = async () => {
    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/settings/brand-kit', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.ok && result.data) {
        setData(result.data)
        setFormData({
          primary_color: result.data.primary_color || "#3B82F6",
          secondary_color: result.data.secondary_color || "#10B981",
          accent_color: result.data.accent_color || "#F59E0B",
          heading_font: result.data.heading_font || "Inter",
          body_font: result.data.body_font || "Inter"
        })
      }
    } catch (error) {
      console.error('Failed to load brand kit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('supabase-token')
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setSaving(false)
        return
      }

      const response = await fetch('/api/settings/brand-kit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.ok) {
        setMessage({ type: 'success', text: 'Brand kit saved successfully' })
        setData(result.data)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save brand kit' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save brand kit' })
    } finally {
      setSaving(false)
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Brand Colors</CardTitle>
            </div>
            <CardDescription>Define your organization's color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fonts */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Choose your brand fonts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heading-font">Heading Font</Label>
              <Select
                id="heading-font"
                value={formData.heading_font}
                onChange={(e) => setFormData({ ...formData, heading_font: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lato">Lato</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body-font">Body Font</Label>
              <Select
                id="body-font"
                value={formData.body_font}
                onChange={(e) => setFormData({ ...formData, body_font: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Nunito">Nunito</option>
              </Select>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <p className="text-2xl font-bold" style={{ fontFamily: formData.heading_font }}>
                Heading Preview
              </p>
              <p className="text-base" style={{ fontFamily: formData.body_font }}>
                Body text preview in your selected font.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Brand Kit
          </>
        )}
      </Button>
    </div>
  )
}
