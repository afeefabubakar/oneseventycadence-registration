import { parseSimpleMarkdownToHtml, getBaseUrl, renderEmailLayout } from './utils'
import { DEFAULT_POSTPONED_TEMPLATE, DEFAULT_CANCELLED_TEMPLATE } from './templates'

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
  const baseUrl = getBaseUrl()
  const refundUrl = `${baseUrl}/refund/${refundToken}`

  const formattedAmount = amount && amount > 0 ? `RM ${amount.toFixed(2)}` : null
  const isPostponed = noticeType === 'postponed'

  const headerTitle = isPostponed ? 'Event Postponed' : 'Event Cancelled'
  const headerSubtitle = isPostponed
    ? `Important update regarding ${eventName}`
    : `Cancellation notice for ${eventName}`
  const headerGradient = 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)'

  const ctaTitle = isPostponed ? 'Refund Options' : 'Full Refund Information'
  const ctaDescription = isPostponed
    ? 'If you cannot make it to the postponed event date, please click below to submit your bank account or DuitNow QR details for a full refund.'
    : 'Please click the button below to submit your bank account or DuitNow QR details so our team can process your refund.'
  const buttonText = isPostponed ? 'Request Refund →' : 'Submit Refund Details →'

  // Format body HTML using shared markdown parser
  let bodyHtml = ''
  if (typeof customMessage === 'string' && customMessage.trim()) {
    bodyHtml = parseSimpleMarkdownToHtml(customMessage)
  }

  if (!bodyHtml) {
    const defaultTemplate = isPostponed ? DEFAULT_POSTPONED_TEMPLATE : DEFAULT_CANCELLED_TEMPLATE
    bodyHtml = parseSimpleMarkdownToHtml(defaultTemplate)
  }

  const contentHtml = `
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
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      If you have any questions or concerns, please reach out to us. We appreciate your kind understanding and support.
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
