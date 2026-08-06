interface CancellationEmailProps {
  name: string
  email: string
  eventName: string
  eventDate: string
  eventLocation: string
  amount?: number | null
  refundToken: string
  noticeType?: 'cancelled' | 'postponed'
  customMessage?: string | null
}

function parseSimpleMarkdownToHtml(text: string): string {
  if (!text || !text.trim()) return ''

  // Safe escape HTML entities
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Convert bold **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Convert italic *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Convert links [text](url) -> <a href="url">text</a>
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" style="color: #E93998; text-decoration: underline; font-weight: 500;">$1</a>',
  )

  // Split into paragraphs by double newlines
  const blocks = html.split(/\n\s*\n/)

  return blocks
    .map((block) => {
      const lines = block.split('\n')

      // Check if block consists of bullet points starting with * or -
      const isBulletList =
        lines.length > 0 &&
        lines.every((line) => {
          const trimmed = line.trim()
          return trimmed.startsWith('* ') || trimmed.startsWith('- ')
        })

      if (isBulletList) {
        const items = lines
          .map((line) => {
            const content = line.trim().replace(/^[\*\-]\s+/, '')
            return `<li style="margin: 4px 0;">${content}</li>`
          })
          .join('')
        return `<ul style="margin: 12px 0; padding-left: 20px; font-size: 15px; color: #374151; line-height: 1.6;">${items}</ul>`
      }

      return `<p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">${lines.join('<br />')}</p>`
    })
    .join('')
}

export function cancellationEmailHtml({
  name,
  email,
  eventName,
  eventDate,
  eventLocation,
  amount,
  refundToken,
  noticeType = 'cancelled',
  customMessage,
}: CancellationEmailProps): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  const refundUrl = `${baseUrl}/refund/${refundToken}`
  const formattedAmount = amount && amount > 0 ? `RM ${amount.toFixed(2)}` : null
  const isPostponed = noticeType === 'postponed'

  const headerTitle = isPostponed ? 'Event Postponed' : 'Event Cancelled'
  const headerSubtitle = isPostponed
    ? `Important update regarding ${eventName}`
    : `Cancellation notice for ${eventName}`
  const headerGradient = isPostponed
    ? 'linear-gradient(135deg,#d97706 0%,#f59e0b 100%)'
    : 'linear-gradient(135deg,#dc2626 0%,#f43f5e 100%)'

  const ctaTitle = isPostponed ? 'Refund Options' : 'Full Refund Information'
  const ctaDescription = isPostponed
    ? 'If you cannot make it to the postponed event date, please click below to upload your DuitNow QR code screenshot for a full refund.'
    : 'Please click the button below to upload your DuitNow QR code screenshot so our team can process your instant refund.'
  const buttonText = isPostponed ? 'Upload DuitNow QR →' : 'Upload DuitNow QR →'

  // Format body HTML using simple markdown parser
  let bodyHtml = ''
  if (typeof customMessage === 'string' && customMessage.trim()) {
    bodyHtml = parseSimpleMarkdownToHtml(customMessage)
  }

  if (!bodyHtml) {
    bodyHtml = isPostponed
      ? `<p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">We regret to inform you that <strong>${eventName}</strong> originally scheduled for <strong>${eventDate}</strong> has been <strong>postponed</strong>. We are working on confirming the new date and will update you shortly.</p><p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">If you are unable to attend on the rescheduled date, you are eligible for a 100% full refund.</p>`
      : `<p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.6;">We deeply regret to inform you that <strong>${eventName}</strong> originally scheduled for <strong>${eventDate}</strong> has been <strong>cancelled</strong>. We sincerely apologize for any inconvenience caused.</p>`
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle} - ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${headerGradient};padding:44px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.9);">oneseventycadence</p>
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${headerTitle}</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.95);">${headerSubtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>

              <!-- Main Body Message -->
              <div style="margin-bottom:32px;">
                ${bodyHtml}
              </div>

              <!-- Refund Call to Action Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;text-align:center;">
                <tr>
                  <td style="padding:32px 24px;">
                    <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">${ctaTitle}</p>
                    <h3 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#0f172a;">
                      ${formattedAmount ? `Refund Amount: ${formattedAmount}` : 'Full Refund Available'}
                    </h3>
                    <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.5;max-width:440px;margin-left:auto;margin-right:auto;">
                      ${ctaDescription}
                    </p>

                    <!-- Button -->
                    <div>
                      <a href="${refundUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#E93998 0%,#ff73b9 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;box-shadow:0 4px 14px rgba(233,57,152,0.35);">
                        ${buttonText}
                      </a>
                    </div>
                    <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">
                      Or copy this link: <a href="${refundUrl}" style="color:#E93998;">${refundUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Event Details Summary -->
              <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;">Event Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #f1f5f9;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;width:35%;font-size:13px;color:#64748b;">Event Name</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;">${eventName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">Date</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#64748b;">Location</td>
                  <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#0f172a;">${eventLocation}</td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                If you have any questions or concerns, please reply directly to this email. We appreciate your kind understanding and support.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#64748b;">
                © ${new Date().getFullYear()} oneseventycadence. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
