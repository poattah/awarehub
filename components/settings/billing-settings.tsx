"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { CreditCard, Receipt } from "lucide-react"

export function BillingSettings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Billing</CardTitle>
        </div>
        <CardDescription>Manage payment method, plan, and invoices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
              <option>Starter</option>
              <option>Growth</option>
              <option>Enterprise</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Billing email</Label>
            <Input placeholder="finance@company.com" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Card on file</Label>
            <div className="flex flex-wrap gap-2">
              <Input className="flex-1" placeholder="**** **** **** 1234" />
              <Button variant="outline">Update card</Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Invoices</p>
            <p className="text-xs text-muted-foreground">Download your past invoices.</p>
          </div>
          <Button variant="outline" size="sm">
            <Receipt className="h-4 w-4 mr-2" />
            View invoices
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
