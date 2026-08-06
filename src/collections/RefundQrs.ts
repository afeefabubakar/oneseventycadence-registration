import type { CollectionConfig } from 'payload'

export const RefundQrs: CollectionConfig = {
  slug: 'refund-qrs',
  labels: {
    singular: 'Refund DuitNow QR',
    plural: 'Refund DuitNow QRs',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'createdAt', 'updatedAt'],
    description: 'Uploaded DuitNow QR images for attendee refund processing',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: () => true, // Allow frontend refund form to upload QR image
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  upload: {
    staticDir: 'refund-qrs',
    adminThumbnail: 'card',
    mimeTypes: ['image/*'],
  },
  fields: [],
}
