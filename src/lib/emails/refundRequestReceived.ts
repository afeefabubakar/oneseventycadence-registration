interface RefundRequestReceivedEmailProps {
  name: string
  email: string
  eventName: string
  amount?: number | null
  bankName?: string | null
  accountNumber?: string | null
  duitnowType?: string | null
}

export function refundRequestReceivedEmailHtml({
  name,
  email,
  eventName,
  amount,
  bankName,
  accountNumber,
  duitnowType,
}: RefundRequestReceivedEmailProps): string {

  const formattedAmount = amount && amount > 0 ? `RM ${amount.toFixed(2)}` : 'Full Fee Refund'
  const isQr = duitnowType === 'qr' || bankName === 'DuitNow QR'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Refund Request Received - ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#eab308 0%,#f59e0b 100%);padding:40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.95);">oneseventycadence</p>
              <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Refund Request Received</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.95);">${eventName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 18px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
                We have successfully received your refund request details for <strong>${eventName}</strong>. Our finance team is reviewing your details and will process your transfer shortly.
              </p>

              <!-- Refund Request Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border:1px solid #fef08a;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ca8a04;">Submitted Details Summary</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
                      <tr>
                        <td style="padding:6px 0;color:#71717a;width:40%;">Account Holder:</td>
                        <td style="padding:6px 0;font-weight:600;color:#0f172a;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;">Refund Amount:</td>
                        <td style="padding:6px 0;font-weight:700;color:#0f172a;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;">Refund Method:</td>
                        <td style="padding:6px 0;font-weight:600;color:#0f172a;">
                          ${isQr ? 'DuitNow QR Screenshot Upload' : `${bankName || 'Bank Transfer'} (${accountNumber || ''})`}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                  🔒 <strong>PDPA Privacy Protection:</strong> If you uploaded a DuitNow QR screenshot, your image is encrypted and stored in an isolated collection. It will be <strong>permanently deleted</strong> from our servers automatically once your refund transfer is completed.
                </p>
              </div>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                You will receive a final confirmation email as soon as the transfer is completed. Thank you so much for your patience!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#64748b;">
                © ${new Date().getFullYear()} oneseventycadence · All rights reserved
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
