"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { UserCircle, Bell } from "lucide-react"
import { useState } from "react"

export function AccountSettings() {
  const [notifyEmail, setNotifyEmail] = useState(true)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          <CardTitle>Account</CardTitle>
        </div>
        <CardDescription>Manage your personal profile and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input placeholder="Your name" />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input placeholder="you@company.com" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <p className="font-semibold text-sm">Email notifications</p>
            <p className="text-xs text-muted-foreground">Receive updates about campaigns and invites.</p>
          </div>
          <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
        </div>
        <Button>
          <Bell className="h-4 w-4 mr-2" />
          Save profile
        </Button>
      </CardContent>
    </Card>
  )
}
