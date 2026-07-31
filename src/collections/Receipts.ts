import type { CollectionConfig } from 'payload'

export const Receipts: CollectionConfig = {
  slug: 'receipts',
  labels: {
    singular: 'Receipt',
    plural: 'Receipts',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'createdAt', 'updatedAt'],
    description: 'Payment receipts uploaded by registrants',
  },
  access: {
    // Only authenticated admin users can read/create/update/delete payment receipts
    read: ({ req }) => !!req.user,
    create: ({ req }) => true, // Allow frontend registration API to create/upload receipts
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  upload: {
    staticDir: 'receipts',
    adminThumbnail: 'card',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'notes',
      type: 'textarea',
      label: 'Admin Verification Notes',
      admin: {
        description: 'Internal notes regarding payment verification',
      },
    },
  ],
}
