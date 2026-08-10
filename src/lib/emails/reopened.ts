import { parseSimpleMarkdownToHtml, renderEmailLayout } from './utils'

interface ReopenEmailProps {
  name: string
  email: string
  eventName: string
  eventDate: string
  eventLocation: string
  eventLocationLink?: string | null
  eventDescription?: string | null
  customMessage?: string | null
}

export function reopenedEmailHtml({
  name,
  email,
  eventName,
  eventDate,
  eventLocation,
  eventLocationLink,
  eventDescription,
  customMessage,
}: ReopenEmailProps): string {
  const headerTitle = 'Event Reopened 🎉'
  const headerSubtitle = `Updated event details for ${eventName}`
  const headerGradient = 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)'

  // Format body HTML using shared markdown parser with brand color
  let bodyHtml = ''
  if (typeof customMessage === 'string' && customMessage.trim()) {
    bodyHtml = parseSimpleMarkdownToHtml(customMessage, '#E93998')
  }

  if (!bodyHtml) {
    bodyHtml = `<p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">We are excited to inform you that <strong>${eventName}</strong> has been rescheduled and is officially reopened!</p><p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">Your registration remains <strong>active and confirmed</strong> for the new date. Please check the updated event details below.</p>`
  }

  const contentHtml = `
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Hi <strong>${name}</strong>,
    </p>

    <!-- Main Body Message -->
    <div style="margin-bottom:32px;">
      ${bodyHtml}
    </div>

    <!-- Updated Event Details Card (Brand Styling) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f8;border:1px solid #fbcfe8;border-radius:12px;margin-bottom:32px;">
      <tr>
        <td style="padding:28px 24px;">
          <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#be185d;">🗓️ Updated Event Details</p>
          
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

    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">
        ✅ <strong>Registration Status:</strong> Your spot is secured! No action is needed unless you have further questions for our team.
      </p>
    </div>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      Thank you so much for your patience, support, and understanding. We look forward to seeing you at the event!
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
