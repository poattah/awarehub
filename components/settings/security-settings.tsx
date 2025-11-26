"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ShieldCheck, Lock } from "lucide-react"

export function SecuritySettings() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [backupEmail, setBackupEmail] = useState('')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <CardTitle>Security & 2FA</CardTitle>
        </div>
        <CardDescription>Protect your account with two-factor authentication.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
          <div>
            <p className="font-semibold">Two-factor authentication</p>
            <p className="text-sm text-muted-foreground">Require a code at sign-in. Connect your auth provider to enforce.</p>
          </div>
          <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Backup email</p>
          <Input
            placeholder="backup@company.com"
            value={backupEmail}
            onChange={(e) => setBackupEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Use a backup email for recovery communications.</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Lock className="h-4 w-4 mr-2" />
            Save security settings
          </Button>
          <Button variant="outline">Generate backup codes</Button>
        </div>
      </CardContent>
    </Card>
  )
}
