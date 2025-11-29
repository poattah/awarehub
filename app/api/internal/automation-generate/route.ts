'use server'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { prompt } = body as { prompt?: string }
  const title = prompt?.trim() || 'Awareness campaign'

  // Simple deterministic generation (stubbed “AI”)
  const nodes = [
    {
      id: crypto.randomUUID(),
      type: 'start',
      label: 'Campaign brief',
      data: { prompt: title },
      position: { x: 120, y: 160 },
    },
    {
      id: crypto.randomUUID(),
      type: 'list',
      label: 'Target list/segment',
      data: { list: 'Primary audience' },
      position: { x: 360, y: 100 },
    },
    {
      id: crypto.randomUUID(),
      type: 'email',
      label: 'Email: Kickoff',
      data: { subject: `${title} kickoff`, body: 'Welcome email with goals and CTA.' },
      position: { x: 620, y: 60 },
    },
    {
      id: crypto.randomUUID(),
      type: 'slack',
      label: 'Slack: Nudge',
      data: { message: 'Reminder post with link to resources.' },
      position: { x: 620, y: 200 },
    },
    {
      id: crypto.randomUUID(),
      type: 'sms',
      label: 'SMS: Reminder',
      data: { message: 'Short SMS reminder with CTA.' },
      position: { x: 620, y: 340 },
    },
    {
      id: crypto.randomUUID(),
      type: 'wait',
      label: 'Wait 3 days',
      data: { duration: '3d' },
      position: { x: 860, y: 160 },
    },
    {
      id: crypto.randomUUID(),
      type: 'quiz',
      label: 'Quiz/Assessment',
      data: { prompt: 'Short quiz on key learnings.' },
      position: { x: 1120, y: 160 },
    },
    {
      id: crypto.randomUUID(),
      type: 'publish',
      label: 'Publish & track',
      data: { note: 'Ready to launch with analytics.' },
      position: { x: 1360, y: 160 },
    },
  ]

  const [start, list, email, slack, sms, wait, quiz, pub] = nodes.map((n) => n.id)
  const edges = [
    { id: crypto.randomUUID(), source: start, target: list, label: 'Audience' },
    { id: crypto.randomUUID(), source: list, target: email, label: 'Email' },
    { id: crypto.randomUUID(), source: list, target: slack, label: 'Slack' },
    { id: crypto.randomUUID(), source: list, target: sms, label: 'SMS' },
    { id: crypto.randomUUID(), source: email, target: wait, label: 'Delay' },
    { id: crypto.randomUUID(), source: slack, target: wait, label: 'Delay' },
    { id: crypto.randomUUID(), source: sms, target: wait, label: 'Delay' },
    { id: crypto.randomUUID(), source: wait, target: quiz, label: 'Assess' },
    { id: crypto.randomUUID(), source: quiz, target: pub, label: 'Launch' },
  ]

  return NextResponse.json({ nodes, edges })
}
