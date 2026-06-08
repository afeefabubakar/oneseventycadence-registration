import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import nodemailer from 'nodemailer'
import { confirmationEmailHtml } from '@/lib/emails/confirmation'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^01\d{8,9}$/, 'Phone must be a valid Malaysian number (e.g. 0123456789)'),
  eventId: z.string().min(1, 'Please select an event'),
})

async function sendEmailViaBrevo({
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, email, phone, eventId } = parsed.data

    const payload = await getPayload({ config: configPromise })

    // Fetch event
    const event = await payload.findByID({ collection: 'events', id: eventId })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.isActive) {
      return NextResponse.json(
        { error: 'This event is no longer accepting registrations' },
        { status: 400 },
      )
    }

    // Check capacity
    const registrationCount = await payload.count({
      collection: 'registrations',
      where: {
        event: { equals: eventId },
        status: { equals: 'confirmed' },
      },
    })

    if (event.capacity && registrationCount.totalDocs >= event.capacity) {
      return NextResponse.json(
        { error: 'Sorry, this event is full. No more slots available.' },
        { status: 400 },
      )
    }

    // Check for duplicate registration (same email + same event)
    const existing = await payload.find({
      collection: 'registrations',
      where: {
        email: { equals: email },
        event: { equals: eventId },
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      return NextResponse.json(
        { error: 'You have already registered for this event with this email address.' },
        { status: 409 },
      )
    }

    // Save registration
    await payload.create({
      collection: 'registrations',
      data: {
        name,
        email,
        phone,
        event: parseInt(eventId, 10),
        status: 'confirmed',
      },
    })

    // Send confirmation email
    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString('en-MY', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'TBA'

    await sendEmailViaBrevo({
      to: email,
      subject: `You're registered for ${event.name}! 🎉`,
      html: confirmationEmailHtml({
        name,
        email,
        phone,
        eventName: event.name,
        eventDate,
        eventLocation: event.location,
        eventDescription: event.description ?? null,
      }),
    })

    return NextResponse.json({ success: true, message: 'Registration confirmed!' }, { status: 201 })
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
