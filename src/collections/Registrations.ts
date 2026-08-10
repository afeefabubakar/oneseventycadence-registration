import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import {
  sendConfirmationEmailHelper,
  sendRejectionEmailHelper,
  sendRefundConfirmationEmailHelper,
} from '@/lib/emails/sendEmail'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'email',
      'phone',
      'event',
      'status',
      'refundStatus',
      'receipt',
      'attended',
      'createdAt',
    ],
    components: {
      beforeListTable: ['/components/RegistrationsListHeader#RegistrationsListHeader'],
    },
  },
  timestamps: true,
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        if (!data.refundToken) {
          data.refundToken = crypto.randomUUID()
        }
        const currentRefundStatus = data.refundStatus ?? originalDoc?.refundStatus
        if (currentRefundStatus === 'refunded') {
          data.status = 'cancelled'
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        revalidatePath('/')

        // Send confirmation email when status changes to 'confirmed' from 'pending'
        const isStatusChangedToConfirmed =
          operation === 'update' &&
          doc.status === 'confirmed' &&
          previousDoc?.status !== 'confirmed'

        if (isStatusChangedToConfirmed && doc.email) {
          try {
            let eventObj = doc.event
            if (typeof eventObj === 'number' || typeof eventObj === 'string') {
              eventObj = await req.payload.findByID({
                collection: 'events',
                id: String(eventObj),
              })
            }

            if (eventObj) {
              await sendConfirmationEmailHelper({
                name: doc.name,
                email: doc.email,
                phone: doc.phone,
                event: eventObj,
                isPendingVerification: false,
              })
            }
          } catch (emailErr) {
            console.error(
              '[Registrations hook] Error sending confirmation email on status update:',
              emailErr,
            )
          }
        }

        // Send rejection email when status changes to 'declined' or 'cancelled' (unless refunded)
        const isStatusChangedToDeclined =
          operation === 'update' &&
          (doc.status === 'declined' || doc.status === 'cancelled') &&
          previousDoc?.status !== 'declined' &&
          previousDoc?.status !== 'cancelled' &&
          doc.refundStatus !== 'refunded'

        if (isStatusChangedToDeclined && doc.email) {
          try {
            let eventObj = doc.event
            if (typeof eventObj === 'number' || typeof eventObj === 'string') {
              eventObj = await req.payload.findByID({
                collection: 'events',
                id: String(eventObj),
              })
            }

            if (eventObj) {
              let reasonText: string | null = null

              if (doc.declineReason === 'wrong_amount') {
                reasonText =
                  'The payment amount on your uploaded receipt does not match the required commitment fee for this event.'
              } else if (doc.declineReason === 'invalid_receipt') {
                reasonText =
                  'The uploaded payment receipt was unclear, unreadable, or not a valid DuitNow transaction screenshot.'
              } else if (doc.declineReason === 'others' && doc.customDeclineReason) {
                reasonText = doc.customDeclineReason
              }

              await sendRejectionEmailHelper({
                name: doc.name,
                email: doc.email,
                phone: doc.phone,
                event: eventObj,
                reason: reasonText,
              })
            }
          } catch (emailErr) {
            console.error(
              '[Registrations hook] Error sending rejection email on status update:',
              emailErr,
            )
          }
        }

        // Send refund completion email & auto-purge DuitNow QR screenshot when refundStatus changes to 'refunded'
        const isRefundStatusChangedToRefunded =
          operation === 'update' &&
          doc.refundStatus === 'refunded' &&
          previousDoc?.refundStatus !== 'refunded'

        if (isRefundStatusChangedToRefunded) {
          // Auto-purge DuitNow QR screenshot once refund is completed (PDPA Data Minimization & Compliance)
          if (doc.refundQrImage) {
            try {
              const qrId =
                typeof doc.refundQrImage === 'object' ? doc.refundQrImage.id : doc.refundQrImage
              if (qrId) {
                await req.payload.delete({
                  collection: 'refund-qrs',
                  id: String(qrId),
                })
                console.log(
                  `[PDPA Auto-Purge] Successfully deleted DuitNow QR image ${qrId} for registration ${doc.id} after refund completion.`,
                )
              }
            } catch (purgeErr) {
              console.error('[PDPA Auto-Purge] Error deleting QR image:', purgeErr)
            }
          }

          if (doc.email) {
            try {
              let eventObj = doc.event
              if (typeof eventObj === 'number' || typeof eventObj === 'string') {
                eventObj = await req.payload.findByID({
                  collection: 'events',
                  id: String(eventObj),
                })
              }

              if (eventObj) {
                await sendRefundConfirmationEmailHelper({
                  name: doc.name,
                  email: doc.email,
                  event: eventObj,
                  amount: doc.amount || eventObj.amount || 0,
                  bankName: doc.refundBank,
                  accountNumber: doc.refundAccountNumber,
                })
              }
            } catch (emailErr) {
              console.error(
                '[Registrations hook] Error sending refund confirmation email:',
                emailErr,
              )
            }
          }
        }
      },
    ],
    afterDelete: [
      async () => {
        try {
          revalidatePath('/')
        } catch (err) {
          console.error('[Registrations hook] Error in afterDelete revalidatePath:', err)
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full Name',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: 'Email Address',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Phone Number',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      label: 'Event',
    },
    {
      name: 'amount',
      type: 'number',
      label: 'Amount (RM)',
      min: 0,
      admin: {
        description: 'Payment / commitment fee amount for this registration in RM',
      },
    },
    {
      name: 'receipt',
      type: 'upload',
      relationTo: 'receipts',
      required: false,
      label: 'Payment Receipt',
      admin: {
        description: 'Uploaded payment proof / receipt screenshot',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      label: 'Status',
      options: [
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Pending Verification', value: 'pending' },
        { label: 'Payment Declined', value: 'declined' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'declineReason',
      type: 'select',
      label: 'Decline Reason',
      options: [
        { label: 'Wrong Amount Paid', value: 'wrong_amount' },
        { label: 'Invalid / Unreadable Receipt', value: 'invalid_receipt' },
        { label: 'Others (Specify reason below)', value: 'others' },
      ],
      admin: {
        condition: (data) => data?.status === 'declined',
        description: 'Select why this registration payment was declined',
      },
    },
    {
      name: 'customDeclineReason',
      type: 'textarea',
      label: 'Decline Reason',
      admin: {
        condition: (data) => data?.status === 'declined' && data?.declineReason === 'others',
        description:
          'Enter a custom message to include in the decline email sent to the registrant',
      },
    },
    {
      name: 'refundToken',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Unique secret token generated per registration for refund link',
      },
    },
    {
      name: 'refundStatus',
      type: 'select',
      defaultValue: 'not_requested',
      label: 'Refund Status',
      options: [
        { label: 'Not Requested', value: 'not_requested' },
        { label: 'Refund Requested', value: 'requested' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'refundBank',
      type: 'text',
      label: 'Refund Bank Name / Provider',
      admin: {
        description: 'e.g. Maybank, CIMB, Touch n Go eWallet',
      },
    },
    {
      name: 'refundAccountName',
      type: 'text',
      label: 'Refund Account Holder Name',
    },
    {
      name: 'refundAccountNumber',
      type: 'text',
      label: 'Refund Account Number / DuitNow ID',
    },
    {
      name: 'refundDuitnowType',
      type: 'select',
      label: 'Refund Method Type',
      options: [
        { label: 'Bank Account Number', value: 'account' },
        { label: 'DuitNow QR Image', value: 'qr' },
      ],
    },

    {
      name: 'refundQrImage',
      type: 'upload',
      relationTo: 'refund-qrs',
      label: 'Refund DuitNow QR Image',
      admin: {
        description: 'Uploaded DuitNow QR screenshot from attendee for 1-click scan refund',
      },
    },

    {
      name: 'refundRequestedAt',
      type: 'date',
      label: 'Refund Requested At',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'refundedAt',
      type: 'date',
      label: 'Refunded At',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'refundNotes',
      type: 'textarea',
      label: 'Refund Notes / Reference',
      admin: {
        description: 'Internal notes or bank transfer reference number',
      },
    },
    {
      name: 'attended',
      type: 'checkbox',
      label: 'Attended',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        components: {
          Cell: '/components/AttendedCell#AttendedCell',
        },
      },
    },
  ],
}
