'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && !cancelled) {
        // Redirect unauthenticated users to login, preserving intended path
        const redirectTo = encodeURIComponent(pathname || '/dashboard')
        router.push(`/auth/login?redirectTo=${redirectTo}`)
      }

      if (!cancelled) {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-screen z-10">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10">
          <Header />
        </div>

        {/* Scrollable Content with smooth transitions */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {checkingAuth ? (
              <div className="text-sm text-muted-foreground">Checking your session…</div>
            ) : (
              <div
                className={`transition-all duration-300 ${
                  isTransitioning
                    ? 'opacity-0 translate-y-2'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {children}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
