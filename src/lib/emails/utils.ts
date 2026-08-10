export function parseSimpleMarkdownToHtml(text: string, linkColor: string = '#E93998'): string {
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
    `<a href="$2" target="_blank" style="color: ${linkColor}; text-decoration: underline; font-weight: 500;">$1</a>`,
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

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://registration.oneseventycadence.com'
    : 'http://localhost:3000'
}

export interface EmailLayoutProps {
  title: string
  headerTitle: string
  headerSubtitle: string
  headerGradient?: string
  contentHtml: string
}

export function renderEmailLayout({
  title,
  headerTitle,
  headerSubtitle,
  headerGradient = 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)',
  contentHtml,
}: EmailLayoutProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - oneseventycadence</title>
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
              ${contentHtml}
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
