'use client'

import { Button } from '@/components/ui/button'
import { Bell, Search, User } from 'lucide-react'

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-6">
      <div className="flex items-center flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Search campaigns, templates..."
            className="w-full rounded-xl border border-border/60 bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-soft-lg transition-all"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative group"
        >
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl group"
        >
          <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </header>
  )
}
