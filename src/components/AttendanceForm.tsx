'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Mail, CalendarDays, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const attendanceSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  eventId: z.string().min(1, 'Please select an event'),
})

type FormValues = z.infer<typeof attendanceSchema>

export interface AttendanceEvent {
  id: string
  name: string
  date: string
  location: string
}

interface AttendanceFormProps {
  events: AttendanceEvent[]
}

export function AttendanceForm({ events }: AttendanceFormProps) {
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('eventId')

  const [isSuccess, setIsSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    name: string
    eventName: string
    alreadyAttended: boolean
    message: string
  } | null>(null)

  // Default to query param if valid, or the latest event
  const initialEventId =
    events.find((e) => e.id === eventIdParam)?.id || (events.length > 0 ? events[0].id : '')

  const form = useForm<FormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      email: '',
      eventId: initialEventId,
    },
  })

  // Update selected event if query param changes
  useEffect(() => {
    if (eventIdParam && events.some((e) => e.id === eventIdParam)) {
      form.setValue('eventId', eventIdParam)
    }
  }, [eventIdParam, events, form])

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Attendance check-in failed. Please try again.')
        return
      }

      setSuccessData({
        name: data.name,
        eventName: data.eventName,
        alreadyAttended: data.alreadyAttended,
        message: data.message,
      })
      setIsSuccess(true)
      toast.success(data.alreadyAttended ? 'Already Checked In' : 'Attendance Confirmed!')
    } catch {
      toast.error('Network error. Please check your internet connection and try again.')
    }
  }

  if (isSuccess && successData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div
          className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            successData.alreadyAttended
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
              : 'bg-green-100 dark:bg-green-900/30 text-green-600'
          }`}
        >
          {successData.alreadyAttended ? (
            <AlertCircle className="h-10 w-10" />
          ) : (
            <CheckCircle2 className="h-10 w-10" />
          )}
        </div>

        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          {successData.alreadyAttended ? 'Already Checked In!' : `Welcome, ${successData.name}!`}
        </h2>

        <p className="text-gray-600 max-w-sm text-sm leading-relaxed mb-1">
          {successData.message}
        </p>

        <p className="text-xs text-gray-400 font-medium">Event: {successData.eventName}</p>

        <Button
          variant="outline"
          className="mt-8 hover:border-pink-500 hover:text-pink-600"
          onClick={() => {
            setIsSuccess(false)
            setSuccessData(null)
            form.setValue('email', '')
          }}
        >
          Submit Attendance for Another Person
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 text-pink-600" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter the email you registered with"
                  autoComplete="email"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event */}
        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <CalendarDays className="h-4 w-4 text-pink-600" />
                Select Event
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {events.length === 0 ? (
                    <SelectItem value="none" disabled>
                      <SelectItemText>No events available</SelectItemText>
                    </SelectItem>
                  ) : (
                    events.map((event) => (
                      <SelectItem
                        key={event.id}
                        value={event.id}
                        textValue={event.name}
                        className="py-3"
                      >
                        <div className="flex flex-col gap-0.5 w-full">
                          <span className="font-medium">
                            <SelectItemText>{event.name}</SelectItemText>
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString('en-MY', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            · {event.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 mt-3 font-semibold text-white transition-all shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#E93998' }}
          disabled={isSubmitting || events.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Attendance'
          )}
        </Button>
      </form>
    </Form>
  )
}
