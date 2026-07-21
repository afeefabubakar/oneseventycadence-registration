import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Toaster } from '@/components/ui/sonner'
import { AttendanceForm, AttendanceEvent } from '@/components/AttendanceForm'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { CalendarOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Event Attendance Check-in | oneseventycadence',
  description: 'Mark your attendance for oneseventycadence events.',
}

async function getActiveEvents(): Promise<AttendanceEvent[]> {
  const payload = await getPayload({ config: configPromise })

  const eventsResult = await payload.find({
    collection: 'events',
    sort: '-date',
    limit: 50,
  })

  return eventsResult.docs
    .filter((event) => (event.showEvent as boolean | undefined) !== false)
    .map((event) => ({
      id: String(event.id),
      name: event.name,
      date: event.date as string,
      location: event.location,
    }))
}

export default async function AttendancePage() {
  const events = await getActiveEvents()

  return (
    <>
      <Toaster position="top-center" richColors />

      <div className="min-h-screen bg-gray-50/50 pb-12">
        {/* Top brand gradient bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #E93998, #f472b6, #E93998)' }}
        />

        <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Link href="/" className="group flex flex-col items-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-105"
                style={{ backgroundColor: '#E93998' }}
              >
                <Image
                  src="/images/osc-logo-white.PNG"
                  alt="oneseventycadence logo"
                  width={42}
                  height={42}
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#E93998' }}>
                oneseventycadence
              </h1>
            </Link>
            <p className="mt-2 text-sm text-gray-500 font-medium">Event Attendance Confirmation</p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
            {events.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8 px-4">
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: '#fdf2f8' }}
                >
                  <CalendarOff className="h-7 w-7" style={{ color: '#E93998' }} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">No Active Events</h2>
                <p className="mt-2 text-sm text-gray-500 max-w-xs">
                  There are no active events currently accepting attendance check-ins.
                </p>
                <Link
                  href="/"
                  className="mt-6 text-sm font-medium text-pink-600 hover:underline"
                >
                  Return to Home
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Attendance Confirmation</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the email address you registered with and select your event to submit your attendance.
                  </p>
                  <div
                    className="mt-3 h-0.5 w-10 rounded-full"
                    style={{ backgroundColor: '#E93998' }}
                  />
                </div>

                <Suspense fallback={<div className="py-8 text-center text-sm text-gray-400">Loading form...</div>}>
                  <AttendanceForm events={events} />
                </Suspense>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} oneseventycadence · Attendance Portal
          </p>
        </div>
      </div>
    </>
  )
}
