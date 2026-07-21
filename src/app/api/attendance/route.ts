import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { z } from 'zod'

const attendanceSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  eventId: z.string().min(1, 'Please select an event'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = attendanceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { email, eventId } = parsed.data
    const cleanEmail = email.trim().toLowerCase()

    const payload = await getPayload({ config: configPromise })

    // Verify event exists
    const event = await payload.findByID({ collection: 'events', id: eventId })
    if (!event) {
      return NextResponse.json({ error: 'Selected event was not found.' }, { status: 404 })
    }

    // Query registrations for this event
    const eventIdNum = isNaN(Number(eventId)) ? eventId : Number(eventId)
    const registrations = await payload.find({
      collection: 'registrations',
      where: {
        or: [{ event: { equals: eventId } }, { event: { equals: eventIdNum } }],
      },
      limit: 1000,
    })

    // Match email case-insensitively
    const matchedReg = registrations.docs.find(
      (reg) => reg.email && reg.email.trim().toLowerCase() === cleanEmail,
    )

    if (!matchedReg) {
      return NextResponse.json(
        {
          error: `No registration found for "${cleanEmail}" under ${event.name}. Please check your email or register for the event first.`,
        },
        { status: 404 },
      )
    }

    if (matchedReg.status === 'cancelled') {
      return NextResponse.json(
        {
          error: `Your registration for ${event.name} has been cancelled. Please contact event staff for assistance.`,
        },
        { status: 400 },
      )
    }

    // Check if already attended
    if (matchedReg.attended) {
      return NextResponse.json(
        {
          success: true,
          alreadyAttended: true,
          name: matchedReg.name,
          eventName: event.name,
          message: `Attendance was already recorded for ${matchedReg.name}.`,
        },
        { status: 200 },
      )
    }

    // Mark attendance
    await payload.update({
      collection: 'registrations',
      id: matchedReg.id,
      data: {
        attended: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        alreadyAttended: false,
        name: matchedReg.name,
        eventName: event.name,
        message: `Welcome, ${matchedReg.name}! Your attendance has been successfully recorded. 🎉`,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('[attendance] error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing attendance. Please try again.' },
      { status: 500 },
    )
  }
}
