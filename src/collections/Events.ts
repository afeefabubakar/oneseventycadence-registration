import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'location', 'capacity', 'isActive', 'showEvent'],
  },
  access: {
    read: () => true, // Publicly readable for homepage
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Event Name',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Event Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'location',
      type: 'text',
      required: true,
      label: 'Location',
    },
    {
      name: 'locationLink',
      type: 'text',
      label: 'Location Map Link (URL)',
    },
    {
      name: 'direction',
      type: 'richText',
      label: 'Directions',
      editor: lexicalEditor({}),
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'capacity',
      type: 'number',
      required: false,
      label: 'Max Capacity (leave empty for unlimited)',
      min: 1,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Allow Registration',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'showEvent',
      type: 'checkbox',
      label: 'Show Event',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'registrationOpenDate',
      type: 'date',
      label: 'Registration Open Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'registrationCloseDate',
      type: 'date',
      label: 'Registration Close Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'paymentSectionSeparator',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/SectionSeparator#PaymentSectionSeparator',
        },
      },
    },
    {
      name: 'requiresPayment',
      type: 'checkbox',
      label: 'Require Payment / Commitment Fee',
      defaultValue: false,
      admin: {
        description: 'Check this to enable DuitNow QR payment and receipt upload for this event',
      },
    },
    {
      name: 'paymentQrImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Payment QR Code Image',
      admin: {
        condition: (data) => Boolean(data?.requiresPayment),
        description: 'Upload or select a payment / DuitNow QR code image from Media',
      },
    },
    {
      name: 'amount',
      type: 'number',
      label: 'Commitment Fee Amount (RM)',
      min: 0,
      admin: {
        condition: (data) => Boolean(data?.requiresPayment),
        description: 'Amount in RM (e.g., 10 for RM10).',
      },
    },
    {
      name: 'paymentInstructions',
      type: 'textarea',
      label: 'Payment Instructions',
      admin: {
        condition: (data) => Boolean(data?.requiresPayment),
        placeholder: 'e.g. Please scan the DuitNow QR code above and transfer the registration fee.',
      },
    },

    {
      name: 'isCancelled',
      type: 'checkbox',
      label: 'Event Cancelled Status',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Managed automatically via the Cancel / Postpone Event button below.',
      },
    },
    {
      name: 'isPostponed',
      type: 'checkbox',
      label: 'Event Postponed Status',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Managed automatically via the Cancel / Postpone Event button below.',
      },
    },


    {
      name: 'noticeMessagePostponed',
      type: 'textarea',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'noticeMessageCancelled',
      type: 'textarea',
      admin: {
        hidden: true,
      },
    },



    {
      name: 'cancelEventSidebarAction',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/CancelEventSidebarAction#CancelEventSidebarAction',
        },
      },
    },
    {
      name: 'registrationsList',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/EventRegistrationsList#EventRegistrationsList',
        },
      },
    },
  ],
}

