import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('Attendance API Integration', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('can create event and registration, then update attendance', async () => {
    // 1. Create a test event
    const event = await payload.create({
      collection: 'events',
      data: {
        name: 'Test Run Event',
        date: new Date().toISOString(),
        location: 'Kuala Lumpur',
        isActive: true,
      },
    })
    expect(event.id).toBeDefined()

    // 2. Create a test registration
    const registration = await payload.create({
      collection: 'registrations',
      data: {
        name: 'Jane Doe',
        email: 'janedoe@example.com',
        phone: '0123456789',
        event: event.id,
        status: 'confirmed',
        attended: false,
      },
    })
    expect(registration.attended).toBe(false)

    // 3. Perform attendance check-in update
    const updated = await payload.update({
      collection: 'registrations',
      id: registration.id,
      data: {
        attended: true,
      },
    })
    expect(updated.attended).toBe(true)

    // Clean up
    await payload.delete({ collection: 'registrations', id: registration.id })
    await payload.delete({ collection: 'events', id: event.id })
  })
})
