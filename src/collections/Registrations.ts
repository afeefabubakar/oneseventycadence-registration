import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { sendConfirmationEmailHelper } from '@/lib/emails/sendEmail'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phone', 'event', 'status', 'receipt', 'attended', 'createdAt'],
    components: {
      beforeListTable: [
        '/components/RegistrationsListHeader#RegistrationsListHeader',
      ],
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
            console.error('[Registrations hook] Error sending confirmation email on status update:', emailErr)
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
        { label: 'Cancelled', value: 'cancelled' },
      ],
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
