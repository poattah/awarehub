# Email Campaign Setup Guide

This guide explains how to set up and use the email campaign functionality in AwareHub.

## Overview

AwareHub uses [Resend](https://resend.com) for sending email campaigns. Resend is a modern email API that provides:
- High deliverability rates
- Simple integration
- Email tracking and analytics
- Professional email templates

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Verify your email address
3. Complete the onboarding process

### 2. Get Your API Key

1. In your Resend dashboard, navigate to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "AwareHub Production")
4. Copy the API key (it will only be shown once)

### 3. Configure Domain (Optional but Recommended)

For production use, you should verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `awarehub.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

Once verified, you can send emails from addresses like `campaigns@yourdomain.com`

### 4. Add API Key to Environment Variables

1. Copy `.env.example` to `.env.local` if you haven't already:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Resend API key to `.env.local`:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

3. For production deployment (Vercel, etc.), add the same environment variable in your hosting platform's settings

### 5. Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

This will install:
- `resend` - Email sending library
- `react-email` - Email template rendering
- Other required dependencies

## Using Email Campaigns

### Creating and Sending a Campaign

1. **Navigate to Campaigns**
   - Go to the Campaigns page in your dashboard
   - Click on an existing campaign or create a new one

2. **Design Your Email**
   - Click **Preview & Design** on any campaign
   - Customize the email content:
     - Subject line
     - Headline
     - Body text
     - Call-to-action button text
     - Images
     - Accent color

3. **Send a Test Email**
   - Click the **Send Campaign** button
   - In the modal, enter your email address in the "Test Email Address" field
   - Click **Send Test Email**
   - Check your inbox to verify the email looks correct

4. **Send to Recipients**
   - Once satisfied with the test, select a recipient list from the dropdown
   - Click **Send Campaign to All Recipients**
   - Confirm the action
   - The system will send emails to all contacts in the selected list

### Managing Recipient Lists

Before sending campaigns, you need to set up recipient lists:

1. **Navigate to Recipients**
   - Go to the Recipients page in your dashboard

2. **Create a List**
   - Click **New list / segment**
   - Add contacts manually or import from CSV

3. **Import Contacts**
   - Click **Import CSV**
   - Upload a CSV file with columns: `email`, `full_name`, `title`, `location`

## Email Features

### Personalization

Emails support basic personalization:
- `@companyName` - Replaced with your organization name
- `@firstname` - Replaced with recipient's first name (extracted from full name or email)

### Tracking

The system automatically tracks:
- **Email sends** - Recorded in `engagement_events` table
- **Campaign status** - Updated from `draft` to `active` on first send
- **Channel records** - Campaign-channel associations tracked in `campaign_channels` table

### Campaign Channels

When you send an email campaign:
1. An email channel is automatically created for your organization (if it doesn't exist)
2. A campaign-channel record is created linking the campaign to the email channel
3. The send timestamp and email payload are recorded

## API Endpoint

The email sending is handled by:
```
POST /api/campaigns/send-email
```

### Request Body (Test Mode)

```json
{
  "campaignId": "uuid",
  "subject": "Email subject",
  "headline": "Email headline",
  "bodyText": "Email body content",
  "ctaLabel": "Button text",
  "ctaUrl": "https://destination-url.com",
  "imageUrl": "https://image-url.com/image.jpg",
  "accentColor": "#8B5CF6",
  "testMode": true,
  "testEmail": "test@example.com"
}
```

### Request Body (Production Mode)

```json
{
  "campaignId": "uuid",
  "recipientListId": "uuid",
  "subject": "Email subject",
  "headline": "Email headline",
  "bodyText": "Email body content",
  "ctaLabel": "Button text",
  "ctaUrl": "https://destination-url.com",
  "imageUrl": "https://image-url.com/image.jpg",
  "accentColor": "#8B5CF6",
  "testMode": false
}
```

### Response

```json
{
  "ok": true,
  "message": "Campaign sent successfully to 150 recipients",
  "sentCount": 150,
  "failureCount": 0,
  "totalRecipients": 150,
  "errors": []
}
```

## Email Template

The email template (`lib/email-templates/campaign-email.tsx`) is built using React and renders to HTML. The template includes:

- **Responsive design** - Works on all devices
- **Professional styling** - Clean, modern appearance
- **Brand consistency** - Uses your campaign colors
- **Accessibility** - Follows email best practices
- **Footer branding** - Powered by AwareHub

You can customize the template by editing the file directly.

## Limitations

### Resend Free Tier
- 100 emails per day
- 3,000 emails per month
- 1 verified domain
- All features included

For higher volumes, upgrade to a paid Resend plan.

### Rate Limiting
The API automatically batches emails in groups of 100 to avoid rate limits. Large campaigns (1000+ recipients) may take a few minutes to complete.

### Email Size
Keep your email content concise. Very large emails (>102KB) may have deliverability issues.

## Troubleshooting

### "Email service not configured" Error

**Cause**: Missing `RESEND_API_KEY` environment variable

**Solution**:
1. Check that your `.env.local` file contains `RESEND_API_KEY=...`
2. Restart your development server: `npm run dev`
3. For production, ensure the environment variable is set in your hosting platform

### Test Email Not Received

**Possible causes**:
1. **Spam folder** - Check your spam/junk folder
2. **Domain not verified** - If using a custom domain, verify it in Resend
3. **Invalid API key** - Double-check your API key is correct
4. **Rate limit exceeded** - Wait and try again, or upgrade your Resend plan

**Debugging**:
- Check the browser console for error messages
- Check the server logs (terminal) for detailed error information
- Verify your Resend dashboard shows the email was sent

### Campaign Send Fails

**Common issues**:
1. **No recipients** - Ensure the selected list has contacts with valid emails
2. **Database connection** - Verify Supabase is properly configured
3. **Missing required fields** - All email content fields must be filled

### Emails Look Broken

**Tips**:
1. Test in multiple email clients (Gmail, Outlook, Apple Mail)
2. Keep images hosted on reliable CDNs
3. Use web-safe fonts and colors
4. Avoid complex CSS (email clients have limited support)

## Best Practices

### Content
- **Subject lines**: Keep under 50 characters
- **Headlines**: Clear and compelling
- **Body text**: Brief and scannable (3-5 sentences)
- **CTA**: Single, clear call-to-action

### Timing
- Send test emails to yourself first
- Send to a small segment before full campaign
- Avoid sending on weekends or late at night
- Consider recipient time zones

### Compliance
- Only send to people who opted in
- Include organization name in footer
- Honor unsubscribe requests promptly
- Follow CAN-SPAM and GDPR guidelines

### Deliverability
- Use a verified domain
- Maintain clean recipient lists (remove bounces)
- Monitor engagement rates
- Don't send too frequently

## Advanced Usage

### Custom Email Templates

To create custom templates:

1. Create a new template file in `lib/email-templates/`
2. Follow the React Email format
3. Update the API endpoint to use your template
4. Test thoroughly before sending to production

### Scheduled Campaigns

The system includes `scheduled_jobs` table for future implementation:
- Schedule campaigns for specific dates/times
- Set up recurring campaigns
- Time zone-aware scheduling

### Analytics Integration

Email engagement can be tracked in the `engagement_events` table:
- View: Email sent
- Click: CTA button clicked (requires tracking setup)
- Reaction: User engaged with content

## Support

For issues with:
- **Resend service**: Contact [Resend Support](https://resend.com/support)
- **AwareHub platform**: Create an issue in the GitHub repository
- **Email best practices**: Refer to [Resend Documentation](https://resend.com/docs)

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email)
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-design-best-practices/)
- [CAN-SPAM Compliance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
