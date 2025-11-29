'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Megaphone,
  Layout,
  Palette,
  BarChart3,
  Settings,
  Plug2,
  Users2,
  TrendingUp,
  Zap,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Recipients', href: '/recipients', icon: Users2 },
  { name: 'Growth', href: '/growth', icon: TrendingUp },
  // Automation temporarily disabled
  // { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Templates', href: '/templates', icon: Layout },
  { name: 'Brand Kit', href: '/brand', icon: Palette },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Plug2 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) {
        setUserEmail(session?.user?.email ?? null)
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const widthClass = collapsed ? 'w-20' : 'w-64'

  return (
    <div className={cn('flex h-full flex-col bg-card border-r border-border/50 backdrop-blur-xl transition-all duration-300', widthClass)}>
      {/* Logo Header */}
      <div className="flex h-16 items-center px-4 border-b border-border/50 justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-black shadow-soft group-hover:shadow-soft-lg group-hover:scale-105 transition-all duration-200">
            <svg className="h-5 w-5 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          {!collapsed && <span className="text-lg font-bold group-hover:text-primary transition-colors">AwareHub</span>}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {navigation.map((item, index) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:translate-x-1'
              )}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Hover indicator */}
              {!isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
              )}

              {/* Icon with micro-animation */}
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-200",
                isActive ? "" : "group-hover:scale-110"
              )} />

              {!collapsed && <span className="transition-all duration-200">{item.name}</span>}

              {/* Active indicator dot */}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - User Profile Preview */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-all duration-200 group">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-soft group-hover:shadow-soft-lg transition-all" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userEmail ? userEmail.split('@')[0] : 'Signed in'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail || 'Session active'}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
