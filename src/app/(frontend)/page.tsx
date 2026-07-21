import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Image from 'next/image'
import { Toaster } from '@/components/ui/sonner'
import { RegistrationSection } from '@/components/RegistrationSection'
import { UpcomingRuns } from '@/components/UpcomingRuns'
import { FullyRegisteredRuns } from '@/components/FullyRegisteredRuns'
import { PastRuns } from '@/components/PastRuns'
import { EventItem } from '@/types/event'

export const dynamic = 'force-dynamic'

async function getAllEvents(): Promise<{
  upcomingEvents: EventItem[]
  openUpcomingEvents: EventItem[]
  fullUpcomingEvents: EventItem[]
  registerableEvents: EventItem[]
  pastEvents: EventItem[]
}> {
  const payload = await getPayload({ config: configPromise })

  const eventsResult = await payload.find({
    collection: 'events',
    sort: 'date',
    limit: 100,
  })

  const now = new Date()

  const allEvents: EventItem[] = await Promise.all(
    eventsResult.docs.map(async (event) => {
      const countResult = await payload.count({
        collection: 'registrations',
        where: {
          event: { equals: event.id },
          status: { equals: 'confirmed' },
        },
      })

      const registrationCount = countResult.totalDocs
      const isFull = event.capacity ? registrationCount >= event.capacity : false
      const slotsLeft = event.capacity ? Math.max(0, event.capacity - registrationCount) : null

      const eventDate = new Date(event.date as string)
      const eventEndOfDay = new Date(eventDate.getTime()).setHours(23, 59, 59, 999)
      const isPast = eventEndOfDay < now.getTime()

      const openDate = event.registrationOpenDate ? new Date(event.registrationOpenDate as string) : null
      const closeDate = event.registrationCloseDate ? new Date(event.registrationCloseDate as string) : null

      const isNotStarted = openDate ? now < openDate : false
      const isRegistrationClosed = closeDate ? now > closeDate : false

      let registrationStatus: 'open' | 'not_started' | 'closed' | 'full' = 'open'
      if (!event.isActive) {
        registrationStatus = 'closed'
      } else if (isFull) {
        registrationStatus = 'full'
      } else if (isNotStarted) {
        registrationStatus = 'not_started'
      } else if (isRegistrationClosed) {
        registrationStatus = 'closed'
      }

      return {
        id: String(event.id),
        name: event.name,
        date: event.date as string,
        registrationOpenDate: (event.registrationOpenDate as string | undefined) ?? null,
        registrationCloseDate: (event.registrationCloseDate as string | undefined) ?? null,
        location: event.location,
        locationLink: (event.locationLink as string | undefined) ?? null,
        direction: event.direction ?? null,
        description: (event.description as string | undefined) ?? null,
        capacity: event.capacity ?? null,
        registrationCount,
        isFull,
        slotsLeft,
        isActive: event.isActive ?? true,
        showEvent: (event.showEvent as boolean | undefined) ?? true,
        isPast,
        registrationStatus,
      }
    }),
  )

  const visibleEvents = allEvents.filter((e) => e.showEvent !== false)

  const upcomingEvents = visibleEvents
    .filter((e) => !e.isPast)
    .sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime())

  const openUpcomingEvents = upcomingEvents.filter((e) => !e.isFull)
  const fullUpcomingEvents = upcomingEvents.filter((e) => e.isFull)

  // Events available for active registration form dropdown
  const registerableEvents = upcomingEvents.filter(
    (e) => e.registrationStatus === 'open',
  )

  const pastEvents = visibleEvents
    .filter((e) => e.isPast)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return { upcomingEvents, openUpcomingEvents, fullUpcomingEvents, registerableEvents, pastEvents }
}

export default async function HomePage() {
  const { upcomingEvents, openUpcomingEvents, fullUpcomingEvents, registerableEvents, pastEvents } =
    await getAllEvents()

  return (
    <>
      <Toaster position="top-center" richColors />

      <div className="min-h-screen bg-white">
        {/* Subtle pink top bar */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #E93998, #f472b6, #E93998)' }}
        />

        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          {/* Header */}
          <div className="mb-10 flex flex-col items-center text-center">
            {/* Logo circle */}
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
              style={{ backgroundColor: '#E93998' }}
            >
              <Image
                src="/images/osc-logo-white.PNG"
                alt="oneseventycadence logo"
                width={52}
                height={52}
                className="object-contain"
                priority
              />
            </div>

            {/* Brand name */}
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#E93998' }}>
              oneseventycadence
            </h1>
            <p className="mt-1 text-sm text-gray-400 font-medium tracking-widest uppercase"></p>
          </div>

          {/* Registration Section */}
          <RegistrationSection
            upcomingEvents={upcomingEvents}
            registerableEvents={registerableEvents}
          />

          {/* Upcoming Runs Section */}
          <UpcomingRuns events={openUpcomingEvents} />

          {/* Upcoming & Fully Registered Events Section */}
          <FullyRegisteredRuns events={fullUpcomingEvents} />

          {/* Past Runs Section */}
          <PastRuns events={pastEvents} />

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-gray-300">
            © {new Date().getFullYear()} oneseventycadence · All rights reserved
          </p>
        </div>
      </div>
    </>
  )
}
