import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { EventItem } from '@/types/event'
import { formatEventDateTime, formatMalaysiaDate, formatMalaysiaTime } from '@/lib/utils'

interface UpcomingRunsProps {
  events: EventItem[]
}

function hasRichTextContent(content: any): boolean {
  if (!content) return false
  if (typeof content === 'string') return content.trim().length > 0
  if (typeof content === 'object' && content.root && Array.isArray(content.root.children)) {
    return content.root.children.some((child: any) => {
      if (child.text && typeof child.text === 'string') return child.text.trim().length > 0
      if (Array.isArray(child.children)) {
        return child.children.some(
          (c: any) => c.text && typeof c.text === 'string' && c.text.trim().length > 0,
        )
      }
      return false
    })
  }
  return false
}

export function UpcomingRuns({ events }: UpcomingRunsProps) {

  if (events.length === 0) return null

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4" style={{ color: '#E93998' }} />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          {events.length === 1 ? 'Upcoming Event' : 'Upcoming Events'}
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Pink/Gray left accent bar */}
            <div
              className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
              style={{
                backgroundColor: event.registrationStatus === 'open' ? '#E93998' : '#d1d5db',
              }}
            />

            {/* Title & Badges: Stacked on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <p className="font-semibold text-gray-900 leading-snug">{event.name}</p>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {event.amount != null &&
                  event.amount > 0 &&
                  event.registrationStatus !== 'postponed' &&
                  event.registrationStatus !== 'cancelled' && (
                    <span className="rounded-full bg-pink-50 dark:bg-pink-950/60 px-2.5 py-0.5 text-xs font-bold text-[#E93998] border border-pink-200 dark:border-pink-800">
                      RM {event.amount}
                    </span>
                  )}

                {/* Badge */}
                {event.registrationStatus === 'open' && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: '#fce7f3', color: '#be185d' }}
                  >
                    Registration Open
                  </span>
                )}
                {event.registrationStatus === 'not_started' && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                    {event.registrationOpenDate
                      ? `Registration Opens ${formatMalaysiaDate(event.registrationOpenDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Registration Opens Soon'}
                  </span>
                )}
                {event.registrationStatus === 'postponed' && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                    Postponed
                  </span>
                )}
                {event.registrationStatus === 'cancelled' && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                    Cancelled
                  </span>
                )}
                {(event.registrationStatus === 'full' || event.registrationStatus === 'closed') && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                    Registration Closed
                  </span>
                )}
              </div>
            </div>

            {/* Date & Time and Location */}
            <div className="mt-3 space-y-1 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{formatEventDateTime(event.date, { monthFormat: 'long' })}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
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

            {/* Registration Close Date info (if applicable) */}
            {event.registrationCloseDate && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  Reg Close:{' '}
                  {formatMalaysiaDate(event.registrationCloseDate, {
                    day: 'numeric',
                    month: 'short',
                  })}
                  , {formatMalaysiaTime(event.registrationCloseDate)}
                </span>
              </div>
            )}


            {event.description && (
              <p className="mt-2 text-sm text-gray-400 whitespace-pre-line">{event.description}</p>
            )}

            {hasRichTextContent(event.direction) && (
              <div className="mt-3 border-t border-dashed border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Directions
                </p>
                <RichTextRenderer content={event.direction as any} />
              </div>
            )}


            {/* Capacity & Progress bar */}
            {event.capacity !== null &&
              event.registrationStatus !== 'postponed' &&
              event.registrationStatus !== 'cancelled' && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      {event.registrationCount} of {event.capacity} registered
                    </span>
                    {event.registrationStatus === 'open' && event.slotsLeft !== null && (
                      <span className="font-semibold" style={{ color: '#E93998' }}>
                        {event.slotsLeft} slot{event.slotsLeft !== 1 ? 's' : ''} left
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (event.registrationCount / event.capacity) * 100)}%`,
                        backgroundColor: event.registrationStatus === 'open' ? '#E93998' : '#d1d5db',
                      }}
                    />
                  </div>
                </div>
              )}

          </div>
        ))}
      </div>
    </div>
  )
}
