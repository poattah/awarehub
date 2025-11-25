# AwareHub API Documentation

REST API endpoints for AwareHub platform.

## Authentication

All API requests require authentication via Supabase JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Endpoints

### Campaigns

#### GET /api/campaigns
List all campaigns for the authenticated user's organization.

**Query Parameters:**
- `status` (optional): Filter by status (draft, scheduled, active, completed, archived)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Mental Health Awareness Week",
      "description": "Campaign description",
      "status": "active",
      "start_at": "2024-05-01T00:00:00Z",
      "end_at": "2024-05-07T23:59:59Z",
      "primary_category": "Mental Health",
      "tags": ["wellness", "mental-health"]
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/campaigns
Create a new campaign.

**Request Body:**
```json
{
  "name": "Pride Month 2024",
  "description": "Celebrate diversity and inclusion",
  "awareness_event_id": "uuid",
  "start_at": "2024-06-01T00:00:00Z",
  "end_at": "2024-06-30T23:59:59Z",
  "primary_category": "DEI",
  "tags": ["pride", "lgbtq", "dei"]
}
```

#### GET /api/campaigns/:id
Get campaign details.

#### PATCH /api/campaigns/:id
Update campaign.

#### DELETE /api/campaigns/:id
Soft delete campaign.

---

### Calendar Events

#### GET /api/calendar/events
Get awareness calendar events.

**Query Parameters:**
- `start_date` (optional): Filter events from date (YYYY-MM-DD)
- `end_date` (optional): Filter events until date
- `category` (optional): Filter by category
- `scope` (optional): global or organization

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "International Women's Day",
      "description": "Celebrate women's achievements",
      "category": "DEI",
      "start_date": "2024-03-08",
      "end_date": "2024-03-08",
      "scope": "global",
      "tags": ["dei", "women"]
    }
  ]
}
```

#### POST /api/calendar/events
Create custom awareness event.

---

### Templates

#### GET /api/templates
List available templates.

**Query Parameters:**
- `template_type` (optional): email, slack_card, poster, etc.
- `category_id` (optional): Filter by category
- `is_global` (optional): true/false

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Pride Month Email",
      "description": "Colorful email template",
      "template_type": "email",
      "is_global": true,
      "tags": ["pride", "dei"]
    }
  ]
}
```

#### GET /api/templates/:id
Get template details including layout and sample content.

#### POST /api/templates
Create custom template.

---

### Brand Kit

#### GET /api/brand
Get organization's brand kit.

**Response:**
```json
{
  "brand_kit": {
    "id": "uuid",
    "name": "Acme Corp Brand",
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981",
    "accent_color": "#F59E0B",
    "font_family_heading": "Inter",
    "font_family_body": "Inter",
    "logo_url": "https://...",
    "is_default": true
  }
}
```

#### POST /api/brand
Create or update brand kit.

#### POST /api/brand/assets
Upload brand asset.

---

### Channels

#### GET /api/channels
List configured distribution channels.

**Response:**
```json
{
  "channels": [
    {
      "id": "uuid",
      "type": "slack",
      "name": "Company Slack",
      "is_enabled": true,
      "config": {
        "workspace_id": "T1234567",
        "default_channel": "#general"
      }
    }
  ]
}
```

#### POST /api/channels
Configure new channel.

#### POST /api/channels/:id/test
Test channel connection.

---

### Analytics

#### GET /api/analytics/overview
Get overall engagement metrics.

**Query Parameters:**
- `start_date`: Start of date range
- `end_date`: End of date range
- `campaign_id` (optional): Filter by campaign

**Response:**
```json
{
  "total_views": 12847,
  "total_clicks": 5423,
  "engagement_rate": 42.3,
  "unique_participants": 2847,
  "total_reactions": 3241
}
```

#### GET /api/analytics/campaigns/:id
Get campaign-specific analytics.

#### GET /api/analytics/channels
Get channel performance comparison.

#### GET /api/analytics/export
Export analytics data (CSV/PDF).

---

### Engagement

#### POST /api/engagement/track
Track engagement event.

**Request Body:**
```json
{
  "campaign_id": "uuid",
  "campaign_channel_id": "uuid",
  "event_type": "view",
  "event_value": null,
  "metadata": {
    "device": "desktop",
    "browser": "Chrome"
  }
}
```

---

### Distribution

#### POST /api/distribute/slack
Send campaign to Slack.

**Request Body:**
```json
{
  "campaign_id": "uuid",
  "channel_id": "uuid",
  "target_channels": ["#general", "#announcements"],
  "scheduled_at": "2024-06-01T09:00:00Z"
}
```

#### POST /api/distribute/email
Send campaign via email.

#### POST /api/distribute/teams
Send campaign to Microsoft Teams.

---

## Webhooks

### Slack Events
```
POST /api/webhooks/slack
```

Handles Slack events (interactions, mentions, etc.)

### Microsoft Graph
```
POST /api/webhooks/microsoft
```

Handles Microsoft Teams events.

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Campaign name is required",
    "details": {
      "field": "name"
    }
  }
}
```

### Error Codes
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INVALID_REQUEST`: Validation error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Rate Limits

- **Standard**: 100 requests/minute per organization
- **Growth**: 500 requests/minute per organization
- **Enterprise**: 2000 requests/minute per organization

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## SDKs & Libraries

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Get campaigns
const { data: campaigns } = await supabase
  .from('campaigns')
  .select('*')
  .eq('status', 'active')
```

### Python (Community)
```python
# Coming soon
```

---

## Changelog

### v1.0.0 (2024-11)
- Initial API release
- Campaign management endpoints
- Calendar and template APIs
- Basic analytics

---

## Support

For API support:
- Email: api@awarehub.com
- Developer Portal: https://developers.awarehub.com
- API Status: https://status.awarehub.com
