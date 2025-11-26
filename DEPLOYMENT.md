# AwareHub Deployment Guide

This guide walks you through deploying AwareHub to production.

## Prerequisites

- Supabase account
- Vercel account (or other Next.js hosting)
- Custom domain (optional)

## Step-by-Step Deployment

### 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep secret!)

3. **Run Database Schema**
   - Navigate to SQL Editor in Supabase Dashboard
   - Copy entire contents of `supabase/schema.sql`
   - Execute the SQL
   - Verify tables were created in Table Editor

4. **Load Seed Data**
   - In SQL Editor, copy contents of `supabase/seed.sql`
   - Execute to load 365+ awareness days and starter templates

5. **Configure Storage (Optional)**
   - Go to Storage section
   - Create buckets:
     - `brand-assets` (for logos, images)
     - `campaign-assets` (for generated campaign files)
   - Set appropriate permissions

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial AwareHub deployment"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

6. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

7. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

### 3. Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Navigate to Settings > Domains
3. Add your custom domain (e.g., `app.yourcompany.com`)
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` in environment variables

### 4. Set Up Integration Credentials

#### Slack Integration

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app "AwareHub"
3. Enable OAuth & Permissions:
   - Add scopes: `chat:write`, `channels:read`, `users:read`
4. Get credentials and add to Vercel:
   ```env
   SLACK_CLIENT_ID=your-client-id
   SLACK_CLIENT_SECRET=your-client-secret
   SLACK_SIGNING_SECRET=your-signing-secret
   ```

#### Email via Resend

1. Sign up at [Resend](https://resend.com/) and get an API key.
2. Add to `.env.local` / Vercel:
   ```env
   RESEND_API_KEY=your-resend-key
   RESEND_FROM_EMAIL=AwareHub <noreply@yourdomain.com>
   ```
3. Send emails through the internal route (server-side):
   - `POST /api/integrations/resend/send`
   - JSON: `{"to":["user@company.com"],"subject":"Hello","html":"<p>Hi there</p>"}` (or `text`)
   - Optional: `cc`, `bcc`, `reply_to`
4. Keep the API key server-only; call this route from the app, not Resend directly.

#### SMS via Twilio

1. Add to `.env.local` / Vercel:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxx   # recommended
   ```
2. Use the internal route (server-side only):
   - `POST /api/integrations/twilio/send`
   - JSON: `{"to":"+18777804236","body":"Ahoy 👋"}` (uses `TWILIO_MESSAGING_SERVICE_SID` by default)
   - Optional: `messagingServiceSid` (override) or `from` (if not using messaging service)
3. Keep credentials server-only; do not call Twilio directly from the client.

#### Microsoft Teams/Graph API

1. Go to Azure Portal > App Registrations
2. Register new application "AwareHub"
3. Add API permissions:
   - `ChannelMessage.Send`
   - `Team.ReadBasic.All`
4. Create client secret
5. Add to Vercel:
   ```env
   MICROSOFT_CLIENT_ID=your-app-id
   MICROSOFT_CLIENT_SECRET=your-secret
   MICROSOFT_TENANT_ID=your-tenant-id
   ```

### 5. Enable Authentication

#### Option 1: Supabase Auth (Recommended for MVP)

1. In Supabase Dashboard > Authentication
2. Configure providers (Email, Google, etc.)
3. Set site URL to your Vercel domain
4. Add redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

#### Option 2: Custom Auth Provider

Implement in `app/api/auth/[...nextauth]/route.ts` using NextAuth.js

### 6. Set Up Monitoring

#### Vercel Analytics
- Enable in Vercel Dashboard > Analytics

#### Supabase Logs
- Monitor in Supabase Dashboard > Logs

#### Sentry (Optional)
```bash
npm install @sentry/nextjs
```

Add to `next.config.js`:
```js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'awarehub',
})
```

### 7. Database Backups

1. In Supabase Dashboard > Settings > Database
2. Enable Point in Time Recovery (PITR)
3. Configure backup schedule

### 8. Performance Optimization

#### Enable Edge Functions
```typescript
// In route handlers
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

#### Configure Caching
Add to `next.config.js`:
```js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
}
```

## Environment Variables Reference

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### Optional (for integrations)
```env
# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=

# Microsoft
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# AI Features (Phase 2)
OPENAI_API_KEY=

# Analytics
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_GA_ID=
```

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test user registration/login
- [ ] Check database RLS policies are working
- [ ] Test creating a campaign
- [ ] Verify email/Slack sending
- [ ] Check analytics are recording
- [ ] Test on mobile devices
- [ ] Run Lighthouse performance audit
- [ ] Set up uptime monitoring
- [ ] Configure SSL certificate (automatic with Vercel)
- [ ] Set up error tracking
- [ ] Create admin user account
- [ ] Load initial organization data

## Scaling Considerations

### Database
- Monitor connection pool usage
- Add read replicas for high-traffic
- Consider upgrading Supabase plan for better performance

### Compute
- Vercel auto-scales serverless functions
- Monitor function execution time
- Consider Edge Functions for global performance

### Storage
- Use CDN for static assets
- Optimize image sizes
- Implement lazy loading

## Troubleshooting

### Build Failures
```bash
# Check Node version (requires 18+)
node --version

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies
- Ensure service role key is correct

### Authentication Problems
- Verify redirect URLs
- Check JWT secret configuration
- Ensure auth endpoints are accessible

## Support

For deployment help:
- Email: devops@awarehub.com
- Slack: #deployment channel
- Docs: https://docs.awarehub.com/deployment

---

Last Updated: 2024
