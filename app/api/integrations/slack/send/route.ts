import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { channel, text, blocks } = body as { channel?: string; text?: string; blocks?: unknown }

    if (!channel || !text) {
      return NextResponse.json({ ok: false, error: 'channel and text are required' }, { status: 400 })
    }

    const tokenFromCookie = cookies().get('slack_access_token')?.value
    const token = tokenFromCookie || process.env.SLACK_BOT_TOKEN
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Slack token missing. Connect Slack first.' }, { status: 500 })
    }

    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
      }),
    })

    const data = await slackRes.json()

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.error || 'slack_error' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, ts: data.ts, channel: data.channel })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
