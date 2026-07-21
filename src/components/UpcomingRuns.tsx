import { CalendarDays, MapPin, Users, Clock } from 'lucide-react'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { EventItem } from '@/types/event'
import { formatEventDateTime, formatMalaysiaDate, formatMalaysiaTime } from '@/lib/utils'

interface UpcomingRunsProps {
  events: EventItem[]
}

export function UpcomingRuns({ events }: UpcomingRunsProps) {
  if (events.length === 0) return null

  return (
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
              style={{
                backgroundColor: event.registrationStatus === 'open' ? '#E93998' : '#d1d5db',
              }}
            />

            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                  <div className="flex items-start sm:items-center gap-2">
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    {event.registrationStatus === 'open' && (
                      <span
                        className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: '#fce7f3', color: '#be185d' }}
                      >
                        Open
                      </span>
                    )}
                    {event.registrationStatus === 'not_started' && (
                      <span className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700">
                        Opens {formatMalaysiaDate(event.registrationOpenDate!, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {event.registrationStatus === 'full' && (
                      <span className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                        Full
                      </span>
                    )}
                    {event.registrationStatus === 'closed' && (
                      <span className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                        Upcoming
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
                    {event.registrationStatus === 'open' && event.slotsLeft !== null && (
                      <p className="mt-0.5 text-xs font-medium" style={{ color: '#E93998' }}>
                        {event.slotsLeft} slot{event.slotsLeft !== 1 ? 's' : ''} left
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatEventDateTime(event.date, { monthFormat: 'long' })}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="wrap-break-word">
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
                </div>

                {/* Registration Window Dates info */}
                {(event.registrationOpenDate || event.registrationCloseDate) && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 text-xs text-gray-400">
                    {event.registrationOpenDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Reg Open:{' '}
                        {formatMalaysiaDate(event.registrationOpenDate, {
                          day: 'numeric',
                          month: 'short',
                        })}
                        , {formatMalaysiaTime(event.registrationOpenDate)}
                      </span>
                    )}
                    {event.registrationCloseDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Reg Close:{' '}
                        {formatMalaysiaDate(event.registrationCloseDate, {
                          day: 'numeric',
                          month: 'short',
                        })}
                        , {formatMalaysiaTime(event.registrationCloseDate)}
                      </span>
                    )}
                  </div>
                )}

                {event.description && (
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{event.description}</p>
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
                    backgroundColor: event.registrationStatus === 'open' ? '#E93998' : '#d1d5db',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
