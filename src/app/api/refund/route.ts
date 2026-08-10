import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendRefundRequestReceivedEmailHelper } from '@/lib/emails/sendEmail'

export async function GET(request: Request) {

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const registrations = await payload.find({
      collection: 'registrations',
      where: {
        refundToken: { equals: token },
      },
      depth: 1,
      limit: 1,
    })

    if (!registrations.docs || registrations.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired refund link' }, { status: 404 })
    }

    const reg = registrations.docs[0]
    const eventObj: any = reg.event

    const eventDate = eventObj?.date
      ? new Date(eventObj.date).toLocaleDateString('en-MY', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kuala_Lumpur',
        })
      : 'TBA'

    const qrImageObj: any = reg.refundQrImage
    const refundQrImageUrl = typeof qrImageObj === 'object' && qrImageObj?.url ? qrImageObj.url : null

    return NextResponse.json({
      success: true,
      registration: {
        id: reg.id,
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        amount: reg.amount || eventObj?.amount || 0,
        status: reg.status,
        refundStatus: reg.refundStatus || 'not_requested',
        refundBank: reg.refundBank || '',
        refundAccountName: reg.refundAccountName || '',
        refundAccountNumber: reg.refundAccountNumber || '',
        refundDuitnowType: reg.refundDuitnowType || 'account',
        refundQrImageUrl,
        refundRequestedAt: reg.refundRequestedAt || null,
        refundedAt: reg.refundedAt || null,
        event: {
          name: eventObj?.name || 'Event',
          date: eventDate,
          location: eventObj?.location || '',
          isCancelled: Boolean(eventObj?.isCancelled),
          isPostponed: Boolean(eventObj?.isPostponed),

        },
      },
    })
  } catch (err: any) {
    console.error('[API /api/refund GET] Error:', err)
    return NextResponse.json({ error: 'Server error verifying refund link' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, bankName, accountName, accountNumber, duitnowType, qrImageId } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    if (!accountName) {
      return NextResponse.json(
        { error: 'Account Holder Name is required.' },
        { status: 400 },
      )
    }

    if (duitnowType === 'account') {
      if (!bankName || !accountNumber) {
        return NextResponse.json(
          { error: 'Bank Name and Account Number are required for bank transfer.' },
          { status: 400 },
        )
      }
    } else {
      if (!qrImageId) {
        return NextResponse.json(
          { error: 'DuitNow QR Code screenshot upload is required.' },
          { status: 400 },
        )
      }
    }

    const payload = await getPayload({ config: configPromise })

    const registrations = await payload.find({
      collection: 'registrations',
      where: {
        refundToken: { equals: token },
      },
      limit: 1,
    })

    if (!registrations.docs || registrations.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired refund link' }, { status: 404 })
    }

    const reg = registrations.docs[0]

    // Update registration with refund request details & release spot immediately
    const updated = await payload.update({
      collection: 'registrations',
      id: reg.id,
      data: {
        refundStatus: 'requested',
        status: 'cancelled',
        refundRequestedAt: new Date().toISOString(),
        refundBank: duitnowType === 'account' ? bankName : 'DuitNow QR',
        refundAccountName: accountName,
        refundAccountNumber: duitnowType === 'account' ? accountNumber : 'QR Code Uploaded',
        refundDuitnowType: duitnowType || 'account',
        refundQrImage: duitnowType === 'qr' ? qrImageId : undefined,
      },
    })

    // Send confirmation email to attendee acknowledging receipt of refund request details
    if (reg.email) {
      try {
        let eventObj = reg.event
        if (typeof eventObj === 'number' || typeof eventObj === 'string') {
          eventObj = await payload.findByID({
            collection: 'events',
            id: String(eventObj),
          })
        }
        if (eventObj) {
          await sendRefundRequestReceivedEmailHelper({
            name: accountName || reg.name,
            email: reg.email,
            event: eventObj,
            amount: reg.amount || eventObj.amount || 0,
            bankName: duitnowType === 'account' ? bankName : 'DuitNow QR',
            accountNumber: duitnowType === 'account' ? accountNumber : 'QR Code Uploaded',
            duitnowType: duitnowType || 'account',
          })
        }
      } catch (emailErr) {
        console.error('[API /api/refund POST] Error sending refund request received email:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Refund request submitted successfully',
      refundStatus: updated.refundStatus,
    })

  } catch (err: any) {
    console.error('[API /api/refund POST] Error:', err)
    return NextResponse.json({ error: 'Failed to submit refund request' }, { status: 500 })
  }
}
