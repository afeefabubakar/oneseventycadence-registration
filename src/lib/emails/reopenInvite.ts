import { parseSimpleMarkdownToHtml, getBaseUrl, renderEmailLayout } from './utils'
import { DEFAULT_REOPEN_INVITE_TEMPLATE } from './templates'

interface ReopenInviteEmailProps {
  name: string
  email: string
  eventName: string
  eventDate: string
  eventLocation: string
  eventLocationLink?: string | null
  eventDescription?: string | null
  customMessage?: string | null
}

export function reopenInviteEmailHtml({
  name,
  email,
  eventName,
  eventDate,
  eventLocation,
  eventLocationLink,
  eventDescription,
  customMessage,
}: ReopenInviteEmailProps): string {
  const baseUrl = getBaseUrl()
  const registerUrl = `${baseUrl}/#register`

  const headerTitle = "We're Back! Re-register Now 🎉"
  const headerSubtitle = `New date & details announced for ${eventName}`
  const headerGradient = 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)'

  let bodyHtml = ''
  if (typeof customMessage === 'string' && customMessage.trim()) {
    bodyHtml = parseSimpleMarkdownToHtml(customMessage, '#E93998')
  }

  if (!bodyHtml) {
    bodyHtml = parseSimpleMarkdownToHtml(DEFAULT_REOPEN_INVITE_TEMPLATE, '#E93998')
  }

  const contentHtml = `
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Hi <strong>${name}</strong>,
    </p>

    <!-- Main Body Message -->
    <div style="margin-bottom:32px;">
      ${bodyHtml}
    </div>

    <!-- Updated Event Schedule Card (Brand Styling) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f8;border:1px solid #fbcfe8;border-radius:12px;margin-bottom:32px;">
      <tr>
        <td style="padding:28px 24px;">
          <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#be185d;">🗓️ Updated Event Schedule</p>
          
          <div style="margin-bottom:16px;">
            <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#9d174d;">Event Name</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${eventName}</p>
          </div>

          <div style="margin-bottom:16px;">
            <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#9d174d;">New Date & Time</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${eventDate}</p>
          </div>

          <div style="margin-bottom:${eventDescription ? '16px' : '0'};">
            <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#9d174d;">Location</p>
            <p style="margin:0;font-size:15px;color:#0f172a;">${eventLocation}</p>
            ${
              eventLocationLink
                ? `<p style="margin:6px 0 0 0;font-size:13px;"><a href="${eventLocationLink}" target="_blank" style="color:#E93998;text-decoration:underline;font-weight:600;">View Map / Directions →</a></p>`
                : ''
            }
          </div>

          ${
            eventDescription
              ? `<div>
                  <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#9d174d;">Description / Details</p>
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.5;">${eventDescription}</p>
                </div>`
              : ''
          }
        </td>
      </tr>
    </table>

    <!-- Re-registration Call to Action Card (Brand Styling) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;text-align:center;">
      <tr>
        <td style="padding:28px 24px;">
          <h3 style="margin:0 0 8px 0;font-size:20px;font-weight:800;color:#0f172a;">Want to join us on the new date?</h3>
          <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.5;">
            Registration is officially open! Click below to secure your spot.
          </p>

          <div>
            <a href="${registerUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#E93998 0%,#ff73b9 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;box-shadow:0 4px 14px rgba(233,57,152,0.35);">
              Re-Register for Event →
            </a>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      We hope to see you running with us!
    </p>
  `.trim()

  return renderEmailLayout({
    title: `${headerTitle} - ${eventName}`,
    headerTitle,
    headerSubtitle,
    headerGradient,
    contentHtml,
  })
}
