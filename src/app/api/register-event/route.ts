import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import nodemailer from 'nodemailer'
import { confirmationEmailHtml } from '@/lib/emails/confirmation'
import { sendConfirmationEmailHelper } from '@/lib/emails/sendEmail'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 characters')
    .regex(/^[+\d\s\-()]{8,20}$/, 'Please enter a valid phone number (e.g. 0123456789 or +60123456789)'),
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
    const contentType = req.headers.get('content-type') || ''
    let name = ''
    let email = ''
    let phone = ''
    let eventId = ''
    let receiptFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      name = formData.get('name')?.toString() || ''
      email = formData.get('email')?.toString() || ''
      phone = formData.get('phone')?.toString() || ''
      eventId = formData.get('eventId')?.toString() || ''
      const file = formData.get('receipt')
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        receiptFile = file as File
      }
    } else {
      const body = await req.json()
      name = body.name || ''
      email = body.email || ''
      phone = body.phone || ''
      eventId = body.eventId || ''
    }

    const parsed = registerSchema.safeParse({ name, email, phone, eventId })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const cleanEmail = email.trim().toLowerCase()
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

    const now = new Date()
    if (event.registrationOpenDate && new Date(event.registrationOpenDate) > now) {
      const openDateFormatted = new Date(event.registrationOpenDate).toLocaleDateString('en-MY', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kuala_Lumpur',
      })
      return NextResponse.json(
        { error: `Registration for this event opens on ${openDateFormatted}.` },
        { status: 400 },
      )
    }

    if (event.registrationCloseDate && new Date(event.registrationCloseDate) < now) {
      return NextResponse.json(
        { error: 'Registration for this event has closed.' },
        { status: 400 },
      )
    }

    // Check capacity
    const registrationCount = await payload.count({
      collection: 'registrations',
      where: {
        event: { equals: eventId },
        status: { in: ['confirmed', 'pending'] },
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
        event: { equals: eventId },
      },
      limit: 1000,
    })

    const isDuplicate = existing.docs.some(
      (reg) => reg.email && reg.email.trim().toLowerCase() === cleanEmail,
    )

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'You have already registered for this event with this email address.' },
        { status: 409 },
      )
    }

    // Check if event requires payment (checkbox enabled or has payment QR image)
    const requiresPayment =
      typeof event.requiresPayment === 'boolean'
        ? event.requiresPayment
        : !!event.paymentQrImage

    if (requiresPayment && !receiptFile) {
      return NextResponse.json(
        { error: 'Please upload your payment receipt screenshot to complete registration.' },
        { status: 400 },
      )
    }

    let receiptDocId: number | string | null = null

    // Upload receipt to Receipts collection if provided
    if (receiptFile) {
      try {
        const arrayBuffer = await receiptFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const receiptDoc = await payload.create({
          collection: 'receipts',
          data: {
            notes: `Uploaded during registration for ${event.name} by ${name} (${cleanEmail})`,
          },
          file: {
            data: buffer,
            name: receiptFile.name,
            mimetype: receiptFile.type,
            size: receiptFile.size,
          },
        })
        receiptDocId = receiptDoc.id
      } catch (uploadError) {
        console.error('[register] receipt upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to process receipt upload. Please try uploading a valid image file.' },
          { status: 500 },
        )
      }
    }

    const regStatus = requiresPayment ? 'pending' : 'confirmed'

    // Save registration with receipt link, amount & status
    await payload.create({
      collection: 'registrations',
      data: {
        name,
        email: cleanEmail,
        phone,
        event: parseInt(eventId, 10),
        amount: typeof event.amount === 'number' ? event.amount : undefined,
        status: regStatus,
        receipt: receiptDocId ? (typeof receiptDocId === 'string' ? parseInt(receiptDocId, 10) : receiptDocId) : undefined,
      },
    })

    revalidatePath('/')

    await sendConfirmationEmailHelper({
      name,
      email: cleanEmail,
      phone,
      event,
      isPendingVerification: requiresPayment,
    })

    return NextResponse.json(
      {
        success: true,
        isPending: requiresPayment,
        message: requiresPayment
          ? 'Registration received! Our team will verify your payment receipt shortly.'
          : 'Registration confirmed!',
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
