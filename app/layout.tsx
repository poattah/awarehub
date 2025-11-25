import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'

const rubik = Rubik({ subsets: ['latin'], display: 'swap' })

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
      <body className={rubik.className}>{children}</body>
    </html>
  )
}
