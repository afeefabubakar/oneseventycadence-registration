import { CalendarOff, Users } from 'lucide-react'
import { RegistrationForm } from '@/components/RegistrationForm'
import { EventItem } from '@/types/event'

interface RegistrationSectionProps {
  upcomingEvents: EventItem[]
  registerableEvents: EventItem[]
}

export function RegistrationSection({
  upcomingEvents,
  registerableEvents,
}: RegistrationSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      {upcomingEvents.length === 0 ? (
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
      ) : registerableEvents.length === 0 ? (
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
            Thank you for the incredible support! Registrations for our upcoming events are currently closed or at full capacity. Stay tuned for updates.
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

          <RegistrationForm events={registerableEvents} />
        </>
      )}
    </div>
  )
}
