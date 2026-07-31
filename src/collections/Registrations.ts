import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { sendConfirmationEmailHelper, sendRejectionEmailHelper } from '@/lib/emails/sendEmail'

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

        // Send rejection email when status changes to 'declined' or 'cancelled'
        const isStatusChangedToDeclined =
          operation === 'update' &&
          (doc.status === 'declined' || doc.status === 'cancelled') &&
          previousDoc?.status !== 'declined' &&
          previousDoc?.status !== 'cancelled'

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
      },
    ],
    afterDelete: [
      () => {
        revalidatePath('/')
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
        { label: 'Declined', value: 'declined' },
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
        condition: (data) => data?.status === 'declined' || data?.status === 'cancelled',
        description: 'Select why this registration was declined',
      },
    },
    {
      name: 'customDeclineReason',
      type: 'textarea',
      label: 'Decline Reason',
      admin: {
        condition: (data) =>
          (data?.status === 'declined' || data?.status === 'cancelled') &&
          data?.declineReason === 'others',
        description:
          'Enter a custom message to include in the decline email sent to the registrant',
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
