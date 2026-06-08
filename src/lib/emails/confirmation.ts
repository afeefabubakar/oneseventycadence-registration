interface LexicalNode {
  type: string
  text?: string
  format?: number
  tag?: string
  fields?: {
    url: string
    newTab?: boolean
  }
  children?: LexicalNode[]
}

function serializeLexicalToHtml(content: any): string {
  if (!content || !content.root || !content.root.children) return ''

  function serializeNode(node: LexicalNode): string {
    if (node.type === 'text') {
      let text = node.text || ''
      const format = node.format || 0

      // Escape HTML entities to prevent rendering bugs
      text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

      if (format & 1) text = `<strong>${text}</strong>`
      if (format & 2) text = `<em>${text}</em>`
      if (format & 8) text = `<span style="text-decoration: underline;">${text}</span>`
      if (format & 4) text = `<span style="text-decoration: line-through;">${text}</span>`

      return text
    }

    const childrenHtml = node.children ? node.children.map(serializeNode).join('') : ''

    if (node.type === 'link') {
      const url = node.fields?.url || ''
      const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${url}"${target} style="color: #E93998; text-decoration: underline; font-weight: 500;">${childrenHtml}</a>`
    }

    if (node.type === 'paragraph') {
      return `<p style="margin: 6px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${childrenHtml}</p>`
    }

    if (node.type === 'heading') {
      const tag = node.tag || 'h3'
      const margin = tag === 'h1' ? '20px 0 10px 0' : tag === 'h2' ? '18px 0 8px 0' : '16px 0 6px 0'
      const fontSize = tag === 'h1' ? '18px' : tag === 'h2' ? '16px' : '14px'
      return `<${tag} style="margin: ${margin}; font-size: ${fontSize}; font-weight: 700; color: #111827;">${childrenHtml}</${tag}>`
    }

    if (node.type === 'list') {
      const tag = node.tag || 'ul'
      const style = tag === 'ol'
        ? 'margin: 6px 0; padding-left: 20px; font-size: 14px; color: #4b5563; list-style-type: decimal;'
        : 'margin: 6px 0; padding-left: 20px; font-size: 14px; color: #4b5563; list-style-type: disc;'
      return `<${tag} style="${style}">${childrenHtml}</${tag}>`
    }

    if (node.type === 'listitem') {
      return `<li style="margin: 4px 0;">${childrenHtml}</li>`
    }

    return childrenHtml
  }

  return content.root.children.map(serializeNode).join('')
}

interface ConfirmationEmailProps {
  name: string
  email: string
  phone: string
  eventName: string
  eventDate: string
  eventLocation: string
  eventLocationLink?: string | null
  eventDescription?: string | null
  eventDirection?: any | null
}

export function confirmationEmailHtml({
  name,
  email,
  phone,
  eventName,
  eventDate,
  eventLocation,
  eventLocationLink,
  eventDescription,
  eventDirection,
}: ConfirmationEmailProps): string {
  const directionHtml = eventDirection ? serializeLexicalToHtml(eventDirection) : null

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#E93998 0%,#ff73b9 100%);padding:48px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.9);">oneseventycadence</p>
              <h1 style="margin:0 0 8px 0;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">You're In! 🎉</h1>
              <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.95);">Your registration has been confirmed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">
                Hey <strong>${name}</strong>, we're excited to have you! Here's a summary of your registration:
              </p>

              <!-- Event Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff5f9;border:1px solid #fce7f3;border-left:4px solid #E93998;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#be185d;">Event</p>
                    <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:#111827;">${eventName}</h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;width:40%;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">📅 Date</span>
                        </td>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;">
                          <span style="font-size:14px;color:#111827;font-weight:600;">${eventDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">📍 Location</span>
                        </td>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;">
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
                        eventDescription
                          ? `<tr>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;vertical-align:top;width:40%;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">ℹ️ Details</span>
                        </td>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;">
                          <span style="font-size:14px;color:#374151;line-height:1.5;">${eventDescription}</span>
                        </td>
                      </tr>`
                          : ''
                      }
                      ${
                        directionHtml
                          ? `<tr>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;vertical-align:top;width:40%;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">📍 Directions</span>
                        </td>
                        <td style="padding:8px 0;border-top:1px solid #fce7f3;">
                          <div style="font-size:14px;color:#374151;line-height:1.5;">${directionHtml}</div>
                        </td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Registrant Details -->
              <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;">Your Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #fce7f3;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #fce7f3;">
                    <span style="font-size:13px;color:#6b7280;">Name</span>
                    <p style="margin:2px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #fce7f3;">
                    <span style="font-size:13px;color:#6b7280;">Email</span>
                    <p style="margin:2px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${email}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <span style="font-size:13px;color:#6b7280;">Phone</span>
                    <p style="margin:2px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${phone}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                If you have any questions, feel free to reach out to us. We look forward to seeing you at the event!
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
