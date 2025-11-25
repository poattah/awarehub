import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/integrations/slack?error=${error}`, origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/integrations/slack?error=missing_code', origin))
  }

  const clientId = process.env.SLACK_CLIENT_ID || process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/slack/oauth/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/integrations/slack?error=missing_client', origin))
  }

  const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })

  const data = await tokenRes.json()

  if (!data.ok || !data.access_token) {
    return NextResponse.redirect(new URL(`/integrations/slack?error=${data.error || 'oauth_failed'}`, origin))
  }

  const response = NextResponse.redirect(new URL('/integrations/slack?connected=1', origin))
  response.cookies.set('slack_access_token', data.access_token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
