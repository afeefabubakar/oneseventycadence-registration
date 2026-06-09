import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Toaster } from '@/components/ui/sonner'
import { RegistrationForm } from '@/components/RegistrationForm'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import Image from 'next/image'
import { CalendarDays, MapPin, Users, CalendarOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getActiveEvents() {
  const payload = await getPayload({ config: configPromise })

  const eventsResult = await payload.find({
    collection: 'events',
    where: { isActive: { equals: true } },
    sort: 'date',
    limit: 50,
  })

  const events = await Promise.all(
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

      return {
        id: String(event.id),
        name: event.name,
        date: event.date as string,
        location: event.location,
        locationLink: (event.locationLink as string | undefined) ?? null,
        direction: event.direction ?? null,
        description: (event.description as string | undefined) ?? null,
        capacity: event.capacity ?? null,
        registrationCount,
        isFull,
        slotsLeft,
      }
    }),
  )

  return events
}

export default async function HomePage() {
  const events = await getActiveEvents()

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
          {/* ── Header ── */}
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

          {/* ── Registration Form Card ── */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            {events.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 hover:scale-105"
                  style={{ backgroundColor: '#fdf2f8' }}
                >
                  <CalendarOff className="h-8 w-8" style={{ color: '#E93998' }} />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Catching Our Breath
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 max-w-md">
                  We don't have any event scheduled at the moment, but we're mapping out our next
                  routes! Check back soon or follow us on socials for updates.
                </p>
                {/* Accent bar */}
                <div
                  className="mt-6 h-1 w-12 rounded-full opacity-60"
                  style={{ backgroundColor: '#E93998' }}
                />
              </div>
            ) : events.every((event) => event.isFull) ? (
              <div className="flex flex-col items-center text-center py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 hover:scale-105"
                  style={{ backgroundColor: '#fdf2f8' }}
                >
                  <Users className="h-8 w-8" style={{ color: '#E93998' }} />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Registration Closed
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 max-w-md">
                  Thank you for the incredible support! All our upcoming events are currently at
                  full capacity. Stay tuned for updates.
                </p>
                {/* Accent bar */}
                <div
                  className="mt-6 h-1 w-12 rounded-full opacity-60"
                  style={{ backgroundColor: '#E93998' }}
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Registration Form</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Fill in your details below. A confirmation email will be sent to you.
                  </p>
                  {/* Pink underline accent */}
                  <div
                    className="mt-3 h-0.5 w-10 rounded-full"
                    style={{ backgroundColor: '#E93998' }}
                  />
                </div>

                <RegistrationForm events={events} />
              </>
            )}
          </div>

          {/* ── Events Section ── */}
          {events.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: '#E93998' }} />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                  {events.length === 1 ? 'Upcoming Run' : 'Upcoming Runs'}
                </h3>
              </div>

              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Pink left accent bar */}
                    <div
                      className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                      style={{ backgroundColor: event.isFull ? '#d1d5db' : '#E93998' }}
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div className="w-full">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                          <div className="flex items-start sm:items-center gap-2">
                            <p className="font-semibold text-gray-900">{event.name}</p>
                            {event.isFull ? (
                              <span className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                                Full
                              </span>
                            ) : (
                              <span
                                className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style={{ backgroundColor: '#fce7f3', color: '#be185d' }}
                              >
                                Open
                              </span>
                            )}
                          </div>
                          {/* Slots count */}
                          <div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Users className="h-3.5 w-3.5" />
                              <span className="text-xs">
                                {event.capacity
                                  ? event.isFull
                                    ? `${event.capacity}/${event.capacity}`
                                    : `${event.registrationCount}/${event.capacity}`
                                  : `${event.registrationCount} registered`}
                              </span>
                            </div>
                            {!event.isFull && event.slotsLeft !== null && (
                              <p
                                className="mt-0.5 text-xs font-medium"
                                style={{ color: '#E93998' }}
                              >
                                {event.slotsLeft} slot{event.slotsLeft !== 1 ? 's' : ''} left
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            {new Date(event.date).toLocaleDateString('en-MY', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {event.locationLink ? (
                              <a
                                href={event.locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline font-medium text-pink-600 hover:text-pink-700"
                              >
                                {event.location}
                              </a>
                            ) : (
                              event.location
                            )}
                          </span>
                        </div>

                        {event.description && (
                          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {event.direction && (
                          <div className="mt-3 border-t border-dashed border-gray-100 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                              Directions
                            </p>
                            <RichTextRenderer content={event.direction as any} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slot progress bar */}
                    {event.capacity !== null && (
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (event.registrationCount / event.capacity) * 100)}%`,
                            backgroundColor: event.isFull ? '#d1d5db' : '#E93998',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-gray-300">
            © {new Date().getFullYear()} oneseventycadence · All rights reserved
          </p>
        </div>
      </div>
    </>
  )
}
