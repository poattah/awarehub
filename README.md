# AwareHub 🎯

> **Awareness-as-a-Service Platform** for Corporate Internal Awareness Campaigns

AwareHub is a comprehensive SaaS platform that helps companies design, schedule, distribute, and measure engagement for internal awareness campaigns including DEI initiatives, mental health awareness, heritage months, safety programs, and wellness campaigns.

## ✨ Features

### Core Capabilities

- **📅 Awareness Calendar Engine**: 365+ preloaded global awareness days with smart recommendations
- **🎨 Template & Design Studio**: Canva-style drag-and-drop editor with brand kit integration
- **📢 Multi-Channel Distribution**: Slack, Microsoft Teams, Email, Intranet, and more
- **📊 Analytics Dashboard**: Track engagement, measure impact, and export insights
- **👥 Team Collaboration**: Role-based access control with approval workflows
- **🎯 Campaign Management**: Create, schedule, and manage awareness campaigns end-to-end

### Campaign Types Supported

- DEI & Inclusion
- Mental Health & Wellness
- Heritage Months
- Sustainability
- Safety & Compliance
- Professional Development
- Fun Days & Team Building

## 🏗️ Technical Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (State Management)
- Lucide Icons

**Backend**
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS) for multi-tenancy
- Real-time subscriptions

**Integrations**
- Slack API
- Microsoft Graph API (Teams, Outlook)
- OpenAI API (future feature)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account ([supabase.com](https://supabase.com))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/awarehub.git
   cd awarehub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Set up Supabase database**

   a. Create a new Supabase project at [supabase.com](https://supabase.com)

   b. Run the schema SQL:
   ```bash
   # In Supabase Dashboard > SQL Editor, run:
   # Copy contents of supabase/schema.sql and execute
   ```

   c. Load seed data:
   ```bash
   # In Supabase Dashboard > SQL Editor, run:
   # Copy contents of supabase/seed.sql and execute
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see your app.

## 📦 Database Schema

### Core Tables

- **organizations**: Customer accounts (multi-tenant)
- **profiles**: User profiles linked to Supabase auth
- **campaigns**: Awareness campaigns
- **calendar_events**: Awareness dates (global + custom)
- **templates**: Design templates
- **brand_kits**: Corporate branding configs
- **channels**: Distribution channel configs
- **campaign_channels**: Campaign-channel relationships
- **engagement_events**: User engagement tracking
- **quiz_questions / quiz_responses**: Interactive quizzes
- **surveys / survey_responses**: Pulse surveys

See `supabase/schema.sql` for complete schema.

## 🔒 Security & Multi-Tenancy

AwareHub implements **Row Level Security (RLS)** for complete tenant isolation:

- All data is scoped to `organization_id`
- Users only access data from their organization
- Service role bypasses RLS for admin operations
- JWT claims used for organization context

## 🎨 Brand Kit System

Each organization can configure:
- Primary, secondary, and accent colors
- Heading and body fonts
- Logo variants (light/dark backgrounds)
- Custom brand assets

Templates automatically apply the brand kit for consistent messaging.

## 📊 Analytics & Engagement Tracking

Track key metrics:
- Views, clicks, reactions
- Engagement rates by channel
- Department-level breakdowns
- Campaign performance heatmaps
- Export to CSV/PDF

## 🔌 Channel Integrations

### Slack
```typescript
// Configure in app/api/channels/slack
- OAuth 2.0 authentication
- chat.postMessage for sending
- Block Kit for interactive cards
- Message scheduling
```

### Microsoft Teams
```typescript
// Configure in app/api/channels/teams
- Graph API integration
- Adaptive Cards
- Channel posting
```

### Email (Outlook/Gmail)
```typescript
// Configure in app/api/channels/email
- SMTP/Graph API/Gmail API
- HTML templates
- Distribution lists
```

## 📁 Project Structure

```
awarehub/
├── app/                      # Next.js app directory
│   ├── dashboard/            # Main dashboard
│   ├── campaigns/            # Campaign management
│   ├── calendar/             # Awareness calendar
│   ├── templates/            # Template library
│   ├── brand/                # Brand kit management
│   ├── analytics/            # Analytics & reporting
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Layout components
│   ├── campaigns/            # Campaign-specific components
│   ├── calendar/             # Calendar components
│   └── templates/            # Template components
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── utils/                # Utility functions
├── types/
│   └── database.types.ts     # Generated Supabase types
├── supabase/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Seed data
└── public/                   # Static assets
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Click Deploy

3. **Set up custom domain** (optional)
   - In Vercel dashboard: Settings > Domains
   - Add your custom domain

### Database Backups

Set up automated backups in Supabase:
- Dashboard > Settings > Database > Point in Time Recovery (PITR)
- Enable automatic daily backups

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Generate Supabase Types

After schema changes:
```bash
npm run supabase:generate-types
```

## 📈 Roadmap

### MVP (Current)
- ✅ Awareness calendar
- ✅ Campaign management
- ✅ Template library
- ✅ Brand kit
- ✅ Basic analytics
- ✅ Slack + Email distribution

### Phase 2
- [ ] AI-powered campaign generation
- [ ] Interactive quizzes & surveys
- [ ] Multi-language translation (50+ languages)
- [ ] Advanced design editor with AI
- [ ] TV signage player app
- [ ] Approval workflows
- [ ] Advanced segmentation

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Integrations marketplace
- [ ] White-label solution
- [ ] API for third-party developers
- [ ] Advanced AI analytics

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📧 Email: support@awarehub.com
- 💬 Discord: [Join our community](https://discord.gg/awarehub)
- 📖 Documentation: [docs.awarehub.com](https://docs.awarehub.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/awarehub/issues)

## 🙏 Acknowledgments

- shadcn/ui for beautiful UI components
- Supabase for backend infrastructure
- Lucide for icons
- Vercel for hosting

---

Built with ❤️ by the AwareHub Team
