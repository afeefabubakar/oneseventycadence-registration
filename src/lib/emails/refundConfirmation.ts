interface RefundConfirmationEmailProps {
  name: string
  email: string
  eventName: string
  amount: number
  bankName?: string | null
  accountNumber?: string | null
}

export function refundConfirmationEmailHtml({
  name,
  email,
  eventName,
  amount,
  bankName,
  accountNumber,
}: RefundConfirmationEmailProps): string {
  const formattedAmount = `RM ${Number(amount || 0).toFixed(2)}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Refund Processed - ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header (Brand Gradient) -->
          <tr>
            <td style="background:linear-gradient(135deg,#E93998 0%,#ff73b9 100%);padding:44px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.9);">oneseventycadence</p>
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Refund Processed ✅</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.95);">Your payment has been successfully refunded</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
                Great news! We have processed your refund of <strong>${formattedAmount}</strong> for <strong>${eventName}</strong> via Instant Bank Transfer / DuitNow.
              </p>

              <!-- Transaction Summary Card (Brand Styling) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f8;border:1px solid #fbcfe8;border-left:4px solid #E93998;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#be185d;">Transfer Details</p>
                    <h2 style="margin:0 0 16px 0;font-size:24px;font-weight:800;color:#E93998;">${formattedAmount}</h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #fbcfe8;width:40%;font-size:13px;color:#4b5563;">Event</td>
                        <td style="padding:8px 0;border-top:1px solid #fbcfe8;font-size:14px;font-weight:600;color:#111827;">${eventName}</td>
                      </tr>
                      ${
                        bankName
                          ? `<tr>
                        <td style="padding:8px 0;border-top:1px solid #fbcfe8;font-size:13px;color:#4b5563;">Bank / Provider</td>
                        <td style="padding:8px 0;border-top:1px solid #fbcfe8;font-size:14px;font-weight:600;color:#111827;">${bankName}</td>
                      </tr>`
                          : ''
                      }
                      ${
                        accountNumber
                          ? `<tr>
                        <td style="padding:8px 0;border-top:1px solid #fbcfe8;font-size:13px;color:#4b5563;">Account / DuitNow ID</td>
                        <td style="padding:8px 0;border-top:1px solid #fbcfe8;font-size:14px;font-weight:600;color:#111827;">${accountNumber}</td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px 0;font-size:14px;color:#4b5563;line-height:1.6;">
                Depending on your bank, funds will usually reflect in your bank account immediately or within 1 business day.
              </p>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                Thank you for your patience and understanding. We hope to see you at our future events!
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
