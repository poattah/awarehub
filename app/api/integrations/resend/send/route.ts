import { NextResponse } from 'next/server'

type SendEmailBody = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  reply_to?: string | string[]
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    return NextResponse.json(
      { ok: false, error: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL' },
      { status: 500 }
    )
  }

  let body: SendEmailBody
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.to || !body.subject || (!body.html && !body.text)) {
    return NextResponse.json(
      { ok: false, error: 'to, subject, and html or text are required' },
      { status: 400 }
    )
  }

  const payload: Record<string, unknown> = {
    from,
    to: Array.isArray(body.to) ? body.to : [body.to],
    subject: body.subject,
    html: body.html,
    text: body.text,
  }

  if (body.cc) payload.cc = Array.isArray(body.cc) ? body.cc : [body.cc]
  if (body.bcc) payload.bcc = Array.isArray(body.bcc) ? body.bcc : [body.bcc]
  if (body.reply_to) payload.reply_to = Array.isArray(body.reply_to) ? body.reply_to : [body.reply_to]

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.error || 'resend_error' }, { status: res.status })
    }

    return NextResponse.json({ ok: true, id: data.id, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'resend_request_failed' }, { status: 500 })
  }
}
