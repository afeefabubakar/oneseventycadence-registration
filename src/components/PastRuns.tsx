import { CalendarDays, MapPin } from 'lucide-react'
import { EventItem } from '@/types/event'
import { formatEventDateTime } from '@/lib/utils'

interface PastRunsProps {
  events: EventItem[]
}

export function PastRuns({ events }: PastRunsProps) {
  if (events.length === 0) return null

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          {events.length === 1 ? 'Past Event' : 'Past Events'}
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm opacity-90 transition-shadow hover:shadow-md"
          >
            {/* Gray left accent bar */}
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gray-300" />

            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                  <div className="flex items-start sm:items-center gap-2">
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    <span className="shrink-0 max-sm:mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                      Closed
                    </span>
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

                {event.description && (
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{event.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
