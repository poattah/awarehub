import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AwareHub - Awareness as a Service',
  description: 'Design, schedule, and measure engagement for internal awareness campaigns',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
