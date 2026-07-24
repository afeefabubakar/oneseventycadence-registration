'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, User, Mail, Phone, CalendarDays } from 'lucide-react'

import { formatEventDateTime, formatMalaysiaDate } from '@/lib/utils'
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

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 characters')
    .regex(
      /^[+\d\s\-()]{8,20}$/,
      'Please enter a valid phone number (e.g. 0123456789 or +60123456789)',
    ),
  eventId: z.string().min(1, 'Please select an event'),
})

type FormValues = z.infer<typeof formSchema>

interface Event {
  id: string
  name: string
  date: string
  location: string
  capacity: number | null
  registrationCount: number
  isFull: boolean
  registrationStatus?: 'open' | 'not_started' | 'closed' | 'full'
  registrationOpenDate?: string | null
}

interface RegistrationFormProps {
  events: Event[]
}

export function RegistrationForm({ events }: RegistrationFormProps) {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  // Default to the latest event (by date) that is open for registration
  const defaultEvent =
    [...events]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .find((e) => (e.registrationStatus ? e.registrationStatus === 'open' : !e.isFull)) ||
    events[events.length - 1]
  const defaultEventId = defaultEvent ? defaultEvent.id : ''

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      eventId: defaultEventId,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/register-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmittedName(values.name.split(' ')[0])
      setIsSuccess(true)
      router.refresh()
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          You&apos;re registered, {submittedName}!
        </h2>
        <p className="text-muted-foreground max-w-sm">
          A confirmation email has been sent to you. We can&apos;t wait to see you at the event!
        </p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => {
            setIsSuccess(false)
            form.reset()
          }}
        >
          Register another person
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
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
              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Event
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
                    events.map((event) => {
                      const isDisabled = event.registrationStatus
                        ? event.registrationStatus !== 'open'
                        : event.isFull

                      return (
                        <SelectItem
                          key={event.id}
                          value={event.id}
                          textValue={event.name}
                          disabled={isDisabled}
                          className="py-3"
                        >
                          <div className="flex flex-col gap-0.5 w-full">
                            <span className="font-medium">
                              <SelectItemText>{event.name}</SelectItemText>
                              {event.registrationStatus === 'not_started' && (
                                <span className="ml-2 text-xs font-semibold text-amber-600">
                                  · Reg Opens{' '}
                                  {event.registrationOpenDate
                                    ? formatMalaysiaDate(event.registrationOpenDate, {
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'Soon'}
                                </span>
                              )}
                              {event.registrationStatus === 'full' && (
                                <span className="ml-2 text-xs font-semibold text-destructive">
                                  · Slots Full
                                </span>
                              )}
                              {event.registrationStatus === 'closed' && (
                                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                                  · Reg Closed
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatEventDateTime(event.date, { monthFormat: 'short' })}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-normal wrap-break-word">
                              {event.location}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PDPA Consent Notice */}
        <p className="text-[11px] text-muted-foreground text-center my-3 leading-normal">
          By submitting this form, you consent to oneseventycadence processing your personal data in accordance with our{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="text-[#E93998] font-semibold hover:underline"
          >
            PDPA Privacy Notice
          </Link>
          .
        </p>

        <Button type="submit" className="w-full h-11 mt-2 font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            'Register Now'
          )}
        </Button>
      </form>
    </Form>
  )
}
