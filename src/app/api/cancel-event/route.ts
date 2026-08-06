import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendCancellationEmailHelper } from '@/lib/emails/sendEmail'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Fetch target event
    const eventObj = await payload.findByID({
      collection: 'events',
      id: String(eventId),
    })

    if (!eventObj) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const noticeType = body.noticeType || 'cancelled'
    const customMessage = body.customMessage || null
    const saveOnly = Boolean(body.saveOnly)

    if (saveOnly) {
      const updateData: any = {}
      if (customMessage) {
        if (noticeType === 'postponed') {
          updateData.noticeMessagePostponed = customMessage
        } else {
          updateData.noticeMessageCancelled = customMessage
        }
      }

      await payload.update({
        collection: 'events',
        id: String(eventId),
        data: updateData,
      })

      return NextResponse.json({
        success: true,
        message: 'Template draft saved to event.',
        saveOnly: true,
      })
    }

    // Update event status: isActive: false, and set isPostponed or isCancelled depending on noticeType
    const updateData: any = {
      isActive: false,
      isCancelled: noticeType === 'cancelled',
      isPostponed: noticeType === 'postponed',
    }

    if (customMessage) {
      if (noticeType === 'postponed') {
        updateData.noticeMessagePostponed = customMessage
      } else {
        updateData.noticeMessageCancelled = customMessage
      }
    }

    await payload.update({
      collection: 'events',
      id: String(eventId),
      data: updateData,
    })





    // Fetch all confirmed or pending registrations for this event
    const registrations = await payload.find({
      collection: 'registrations',
      where: {
        event: { equals: eventId },
      },
      limit: 2000,
    })

    let emailsSent = 0
    const errors: string[] = []

    for (const reg of registrations.docs) {
      if (reg.status === 'declined') continue

      try {
        let token = reg.refundToken
        if (!token) {
          token = crypto.randomUUID()
          await payload.update({
            collection: 'registrations',
            id: reg.id,
            data: { refundToken: token },
          })
        }

        if (reg.email) {
          await sendCancellationEmailHelper({
            name: reg.name,
            email: reg.email,
            event: eventObj,
            amount: reg.amount || eventObj.amount || null,
            refundToken: token,
            noticeType,
            customMessage: customMessage || null,
          })
          emailsSent++
        }
      } catch (err: any) {
        console.error(`Error sending notification email to ${reg.email}:`, err)
        errors.push(`${reg.email}: ${err.message}`)
      }
    }

    const actionText = noticeType === 'postponed' ? 'postponed' : 'cancelled'

    return NextResponse.json({
      success: true,
      message: `Event marked as ${actionText}. ${emailsSent} notification email(s) sent.`,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('[API /api/cancel-event POST] Error:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

