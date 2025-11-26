import { NextResponse } from 'next/server'

type SendSmsBody = {
  to: string
  body: string
  messagingServiceSid?: string
  from?: string
}

export async function POST(request: Request) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!accountSid || !authToken) {
    return NextResponse.json(
      { ok: false, error: 'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN' },
      { status: 500 }
    )
  }

  let body: SendSmsBody
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.to || !body.body) {
    return NextResponse.json(
      { ok: false, error: 'to and body are required' },
      { status: 400 }
    )
  }

  const payload = new URLSearchParams()
  payload.append('To', body.to)
  payload.append('Body', body.body)

  if (body.messagingServiceSid || messagingServiceSid) {
    payload.append('MessagingServiceSid', body.messagingServiceSid || messagingServiceSid || '')
  } else if (body.from) {
    payload.append('From', body.from)
  } else {
    return NextResponse.json(
      { ok: false, error: 'Provide MessagingServiceSid (recommended) or From' },
      { status: 400 }
    )
  }

  const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  })

  const data = await twilioRes.json()

  if (!twilioRes.ok) {
    return NextResponse.json({ ok: false, error: data?.message || 'twilio_error' }, { status: twilioRes.status })
  }

  return NextResponse.json({ ok: true, sid: data.sid, status: data.status })
}
