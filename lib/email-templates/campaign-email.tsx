import * as React from 'react'

export interface CampaignEmailProps {
  campaignName: string
  subject: string
  headline: string
  body: string
  ctaLabel: string
  ctaUrl: string
  imageUrl?: string
  accentColor?: string
  organizationName?: string
  recipientName?: string
}

export const CampaignEmail = ({
  campaignName,
  subject,
  headline,
  body,
  ctaLabel,
  ctaUrl,
  imageUrl,
  accentColor = '#8B5CF6',
  organizationName = 'Your Organization',
  recipientName = 'there',
}: CampaignEmailProps) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f5f5f5', margin: 0, padding: 0 }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Header */}
          <tr>
            <td style={{ padding: '40px 40px 0px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: `${accentColor}15`,
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Awareness Campaign
              </div>
            </td>
          </tr>

          {/* Hero Image */}
          {imageUrl && (
            <tr>
              <td style={{ padding: '24px 40px' }}>
                <div style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f8f8f8' }}>
                  <img
                    src={imageUrl}
                    alt={campaignName}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </td>
            </tr>
          )}

          {/* Content */}
          <tr>
            <td style={{ padding: '0px 40px 32px' }}>
              <h1 style={{
                fontSize: '28px',
                lineHeight: '1.3',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 16px'
              }}>
                {headline.replace('@companyName', organizationName)}
              </h1>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#6b7280',
                margin: '0 0 24px'
              }}>
                {body}
              </p>
            </td>
          </tr>

          {/* CTA Button */}
          <tr>
            <td style={{ padding: '0px 40px 40px' }}>
              <a
                href={ctaUrl}
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  backgroundColor: accentColor,
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
                }}
              >
                {ctaLabel}
              </a>
            </td>
          </tr>

          {/* Footer */}
          <tr>
            <td style={{
              padding: '24px 40px 40px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#9ca3af',
                margin: '0'
              }}>
                This awareness campaign was sent by {organizationName}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#d1d5db',
                margin: '8px 0 0'
              }}>
                Powered by AwareHub
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

export default CampaignEmail
