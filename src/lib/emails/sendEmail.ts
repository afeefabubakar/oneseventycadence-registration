import nodemailer from 'nodemailer'
import { confirmationEmailHtml } from './confirmation'
import { rejectionEmailHtml } from './rejection'
import { cancellationEmailHtml } from './cancellation'
import { refundConfirmationEmailHtml } from './refundConfirmation'
import { refundRequestReceivedEmailHtml } from './refundRequestReceived'


export async function sendEmailViaBrevo({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.BREVO_API_KEY || ''
  const smtpKey = process.env.BREVO_SMTP_KEY || ''
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'registration@oneseventycadence.com'

  // If we have an API key (starting with xkeysib-), use the HTTP API
  if (apiKey.startsWith('xkeysib-') || smtpKey.startsWith('xkeysib-')) {
    const activeKey = apiKey.startsWith('xkeysib-') ? apiKey : smtpKey
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': activeKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'oneseventycadence',
          email: fromEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Brevo HTTP API error: ${response.status} - ${errorText}`)
    }
    return
  }

  // Otherwise, fall back to Nodemailer SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: smtpKey,
    },
  })

  await transporter.sendMail({
    from: `"oneseventycadence" <${fromEmail}>`,
    to,
    subject,
    html,
  })
}

export async function sendConfirmationEmailHelper({
  name,
  email,
  phone,
  event,
  isPendingVerification = false,
}: {
  name: string
  email: string
  phone: string
  event: any
  isPendingVerification?: boolean
}) {
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kuala_Lumpur',
      })
    : 'TBA'

  const emailSubject = isPendingVerification
    ? `Registration received for ${event.name}! ⏳`
    : `You're registered for ${event.name}! 🎉`

  const html = confirmationEmailHtml({
    name,
    email,
    phone,
    eventName: event.name,
    eventDate,
    eventLocation: event.location,
    eventLocationLink: event.locationLink ?? null,
    eventDescription: event.description ?? null,
    eventDirection: event.direction ?? null,
    isPendingVerification,
  })

  await sendEmailViaBrevo({
    to: email,
    subject: emailSubject,
    html,
  })
}

export async function sendRejectionEmailHelper({
  name,
  email,
  phone,
  event,
  reason,
}: {
  name: string
  email: string
  phone: string
  event: any
  reason?: string | null
}) {
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kuala_Lumpur',
      })
    : 'TBA'

  const emailSubject = `Registration Status Update for ${event.name}`

  const html = rejectionEmailHtml({
    name,
    email,
    phone,
    eventName: event.name,
    eventDate,
    eventLocation: event.location,
    eventLocationLink: event.locationLink ?? null,
    eventAmount: typeof event.amount === 'number' ? event.amount : null,
    reason: reason ?? null,
  })

  await sendEmailViaBrevo({
    to: email,
    subject: emailSubject,
    html,
  })
}

export async function sendCancellationEmailHelper({
  name,
  email,
  event,
  amount,
  refundToken,
  noticeType = 'cancelled',
  customMessage,
}: {
  name: string
  email: string
  event: any
  amount?: number | null
  refundToken: string
  noticeType?: 'cancelled' | 'postponed'
  customMessage?: string | null
}) {
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kuala_Lumpur',
      })
    : 'TBA'

  const emailSubject = noticeType === 'postponed'
    ? `[Important] Event Postponement Notice: ${event.name}`
    : `[Important] Event Cancellation Notice: ${event.name}`

  const html = cancellationEmailHtml({
    name,
    email,
    eventName: event.name,
    eventDate,
    eventLocation: event.location,
    amount: amount ?? event.amount ?? null,
    refundToken,
    noticeType,
    customMessage: customMessage ?? null,
  })

  await sendEmailViaBrevo({
    to: email,
    subject: emailSubject,
    html,
  })
}


export async function sendRefundConfirmationEmailHelper({
  name,
  email,
  event,
  amount,
  bankName,
  accountNumber,
}: {
  name: string
  email: string
  event: any
  amount: number
  bankName?: string | null
  accountNumber?: string | null
}) {
  const emailSubject = `Refund Confirmation for ${event.name}`

  const html = refundConfirmationEmailHtml({
    name,
    email,
    eventName: event.name,
    amount,
    bankName: bankName ?? null,
    accountNumber: accountNumber ?? null,
  })

  await sendEmailViaBrevo({
    to: email,
    subject: emailSubject,
    html,
  })
}

export async function sendRefundRequestReceivedEmailHelper({
  name,
  email,
  event,
  amount,
  bankName,
  accountNumber,
  duitnowType,
}: {
  name: string
  email: string
  event: any
  amount?: number | null
  bankName?: string | null
  accountNumber?: string | null
  duitnowType?: string | null
}) {
  const emailSubject = `Refund Request Received: ${event.name}`

  const html = refundRequestReceivedEmailHtml({
    name,
    email,
    eventName: event.name,
    amount: amount ?? event.amount ?? null,
    bankName: bankName ?? null,
    accountNumber: accountNumber ?? null,
    duitnowType: duitnowType ?? null,
  })

  await sendEmailViaBrevo({
    to: email,
    subject: emailSubject,
    html,
  })
}


