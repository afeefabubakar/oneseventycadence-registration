import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'location', 'capacity', 'isActive'],
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
      label: 'Show on Registration Form',
      defaultValue: true,
    },
  ],
}
