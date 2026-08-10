interface RejectionEmailProps {
  name: string
  email: string
  phone: string
  eventName: string
  eventDate: string
  eventLocation: string
  eventLocationLink?: string | null
  eventAmount?: number | null
  reason?: string | null
}

export function rejectionEmailHtml({
  name,
  email,
  phone,
  eventName,
  eventDate,
  eventLocation,
  eventLocationLink,
  eventAmount,
  reason,
}: RejectionEmailProps): string {
  const formattedReason = reason ? reason.replace(/\r\n|\r|\n/g, '<br />') : null

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Status Update - oneseventycadence</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header (Brand Gradient) -->
          <tr>
            <td style="background:linear-gradient(135deg,#E93998 0%,#ff73b9 100%);padding:48px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.9);">oneseventycadence</p>
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Registration Declined ⚠️</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.95);">Payment verification issue for your registration</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hey <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
                Thank you for your interest in <strong>${eventName}</strong>. Unfortunately, we were unable to verify your payment receipt, and your registration has been <strong>declined</strong>.
              </p>

              ${
                formattedReason
                  ? `
              <!-- Reason Box (Brand Styling) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f8;border:1px solid #fbcfe8;border-left:4px solid #E93998;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#be185d;">Reason / Notes</p>
                    <div style="font-size:14px;color:#9d174d;line-height:1.5;white-space:pre-line;">${formattedReason}</div>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Event Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Event Details</p>
                    <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#111827;">${eventName}</h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #f3f4f6;width:40%;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">📅 Date</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #f3f4f6;">
                          <span style="font-size:14px;color:#111827;font-weight:600;">${eventDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #f3f4f6;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">📍 Location</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #f3f4f6;">
                          <span style="font-size:14px;color:#111827;font-weight:600;">
                            ${
                              eventLocationLink
                                ? `<a href="${eventLocationLink}" style="color: #E93998; text-decoration: underline;">${eventLocation}</a>`
                                : eventLocation
                            }
                          </span>
                        </td>
                      </tr>
                      ${
                        eventAmount != null && eventAmount > 0
                          ? `<tr>
                        <td style="padding:6px 0;border-top:1px solid #f3f4f6;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">💵 Commitment Fee</span>
                        </td>
                        <td style="padding:6px 0;border-top:1px solid #f3f4f6;">
                          <span style="font-size:14px;color:#111827;font-weight:600;">RM ${eventAmount}</span>
                        </td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5f9;border:1px solid #fce7f3;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#be185d;">What to do next?</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">
                      If you believe this was an error or if you would like to re-submit your payment receipt, please re-register on our website with a clear screenshot of your transaction confirmation, or contact our team directly.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Registrant Details -->
              <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;">Your Information</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;color:#6b7280;">Name</span>
                    <p style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#111827;">${name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;color:#6b7280;">Email</span>
                    <p style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#111827;">${email}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <span style="font-size:12px;color:#6b7280;">Phone</span>
                    <p style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:#111827;">${phone}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                If you have any questions or need support, please get in touch with us.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fff5f9;border-top:1px solid #fce7f3;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#be185d;">
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
