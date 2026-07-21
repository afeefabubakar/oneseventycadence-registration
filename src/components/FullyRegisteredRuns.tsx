import { CalendarDays, MapPin, Users } from 'lucide-react'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { EventItem } from '@/types/event'
import { formatEventDateTime } from '@/lib/utils'

interface FullyRegisteredRunsProps {
  events: EventItem[]
}

export function FullyRegisteredRuns({ events }: FullyRegisteredRunsProps) {
  if (events.length === 0) return null

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          Upcoming &amp; Fully Registered {events.length === 1 ? 'Event' : 'Events'}
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Gray left accent bar */}
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gray-300" />

            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                  <div className="flex items-start sm:items-center gap-2">
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    <span className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                      Full
                    </span>
                  </div>
                  {/* Slots count */}
                  <div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {event.capacity
                          ? `${event.capacity}/${event.capacity}`
                          : `${event.registrationCount} registered`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatEventDateTime(event.date, { monthFormat: 'long' })}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="break-words">
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

            {/* Slot progress bar (100% full) */}
            {event.capacity !== null && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-300 transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
