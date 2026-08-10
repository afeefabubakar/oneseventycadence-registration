import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendReopenEmailHelper, sendReopenInviteEmailHelper } from '@/lib/emails/sendEmail'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { eventId, customMessage, saveOnly, eventData, notifyRefunded = true } = body

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

    if (saveOnly) {
      const updateData: any = {}
      if (customMessage) {
        updateData.noticeMessageReopened = customMessage
      }

      await payload.update({
        collection: 'events',
        id: String(eventId),
        data: updateData,
      })

      return NextResponse.json({
        success: true,
        message: 'Reopen template draft saved to event.',
        saveOnly: true,
      })
    }

    // Update event status: set isPostponed to false, isActive to true, isCancelled to false
    // and apply any optional updated event fields passed in eventData
    const updateData: any = {
      isPostponed: false,
      isActive: true,
      isCancelled: false,
      ...(eventData || {}),
    }

    if (customMessage) {
      updateData.noticeMessageReopened = customMessage
    }

    const updatedEvent = await payload.update({
      collection: 'events',
      id: String(eventId),
      data: updateData,
    })

    // Fetch all registrations for this event
    const registrations = await payload.find({
      collection: 'registrations',
      where: {
        event: { equals: eventId },
      },
      limit: 2000,
    })

    let activeEmailsSent = 0
    let inviteEmailsSent = 0
    const errors: string[] = []

    for (const reg of registrations.docs) {
      if (!reg.email) continue

      const isCancelledOrDeclined = reg.status === 'cancelled' || reg.status === 'declined'
      const isRefunded = reg.refundStatus === 'refunded'

      if (isCancelledOrDeclined || isRefunded) {
        // Send re-registration invitation email to refunded/cancelled participants if enabled
        if (notifyRefunded) {
          try {
            await sendReopenInviteEmailHelper({
              name: reg.name,
              email: reg.email,
              event: updatedEvent,
              customMessage: customMessage || null,
            })
            inviteEmailsSent++
          } catch (err: any) {
            console.error(`Error sending reopen invite email to ${reg.email}:`, err)
            errors.push(`${reg.email}: ${err.message}`)
          }
        }
      } else {
        // Send slot confirmation update email to active participants
        try {
          await sendReopenEmailHelper({
            name: reg.name,
            email: reg.email,
            event: updatedEvent,
            customMessage: customMessage || null,
          })
          activeEmailsSent++
        } catch (err: any) {
          console.error(`Error sending reopen update email to ${reg.email}:`, err)
          errors.push(`${reg.email}: ${err.message}`)
        }
      }
    }

    const totalSent = activeEmailsSent + inviteEmailsSent
    let detailMsg = `${activeEmailsSent} active participant email(s)`
    if (notifyRefunded && inviteEmailsSent > 0) {
      detailMsg += ` and ${inviteEmailsSent} re-registration invite(s)`
    }

    return NextResponse.json({
      success: true,
      message: `Event reopened successfully! Sent ${detailMsg}.`,
      emailsSent: totalSent,
      activeEmailsSent,
      inviteEmailsSent,
      errors: errors.length > 0 ? errors : undefined,
      event: updatedEvent,
    })
  } catch (err: any) {
    console.error('[API /api/reopen-event POST] Error:', err)
    return NextResponse.json({ error: 'Failed to reopen event' }, { status: 500 })
  }
}
