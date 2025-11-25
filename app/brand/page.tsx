import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Upload, Palette } from 'lucide-react'

export default function BrandPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Kit</h1>
          <p className="text-muted-foreground">
            Manage your organization's brand assets and styling
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Brand Kit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>Define your organization's color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  defaultValue="#3B82F6"
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  defaultValue="#3B82F6"
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
                  defaultValue="#10B981"
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  defaultValue="#10B981"
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
                  defaultValue="#F59E0B"
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  defaultValue="#F59E0B"
                  className="flex-1"
                />
              </div>
            </div>
            <Button className="w-full">Save Colors</Button>
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
              <select
                id="heading-font"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option>Inter</option>
                <option>Roboto</option>
                <option>Poppins</option>
                <option>Open Sans</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body-font">Body Font</Label>
              <select
                id="body-font"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option>Inter</option>
                <option>Roboto</option>
                <option>Lato</option>
                <option>Source Sans Pro</option>
              </select>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <p className="text-2xl font-bold">Heading Preview</p>
              <p className="text-base">Body text preview in your selected font.</p>
            </div>
            <Button className="w-full">Save Typography</Button>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Logo & Assets</CardTitle>
            <CardDescription>Upload your organization's brand assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Primary Logo</Label>
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed hover:border-primary cursor-pointer transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Upload Logo</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo (Light Background)</Label>
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed hover:border-primary cursor-pointer transition-colors bg-white">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Upload Logo</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo (Dark Background)</Label>
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed hover:border-primary cursor-pointer transition-colors bg-slate-900">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-400">Upload Logo</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
