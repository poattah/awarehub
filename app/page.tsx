import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Welcome to <span className="text-primary">AwareHub</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your complete Awareness-as-a-Service platform for designing, scheduling,
          and measuring engagement for internal awareness campaigns.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">View Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
