'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  CalendarDays,
  QrCode,
  Upload,
  FileCheck,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { EventItem } from '@/types/event'

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

interface RegistrationFormProps {
  events: EventItem[]
}

export function RegistrationForm({ events }: RegistrationFormProps) {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPendingSuccess, setIsPendingSuccess] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  // Receipt file state
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)

  // Controlled Shadcn Accordion state ('payment' | '')
  const [accordionValue, setAccordionValue] = useState<string>('')

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

  const { watch, formState } = form
  const watchName = watch('name')
  const watchEmail = watch('email')
  const watchPhone = watch('phone')
  const watchEventId = watch('eventId')

  const selectedEvent = events.find((e) => e.id === watchEventId)
  const requiresPayment = !!selectedEvent?.paymentQrImageUrl

  // Check if all required user contact details are validly filled
  const isEmailValid = z.string().email().safeParse(watchEmail).success
  const isPhoneValid = /^[+\d\s\-()]{8,20}$/.test(watchPhone.trim())
  const isNameValid = watchName.trim().length >= 2
  const isFormFilled = isNameValid && isEmailValid && isPhoneValid && !!watchEventId

  // Auto-expand Shadcn accordion when form details are valid and payment is required
  useEffect(() => {
    if (requiresPayment && isFormFilled) {
      setAccordionValue('payment')
    }
  }, [requiresPayment, isFormFilled, watchEventId])

  // Handle receipt file change
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Max 10MB check
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please choose a smaller file.')
      return
    }

    setReceiptFile(file)

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setReceiptPreviewUrl(url)
    } else {
      setReceiptPreviewUrl(null)
    }
  }

  const handleClearReceipt = () => {
    setReceiptFile(null)
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl)
      setReceiptPreviewUrl(null)
    }
  }

  const isSubmitting = formState.isSubmitting

  async function onSubmit(values: FormValues) {
    if (requiresPayment && !receiptFile) {
      setAccordionValue('payment')
      toast.error('Please upload your payment receipt screenshot to complete registration.')
      return
    }

    try {
      let res: Response

      if (requiresPayment && receiptFile) {
        // Send multipart form data for paid registration
        const formData = new FormData()
        formData.append('name', values.name)
        formData.append('email', values.email)
        formData.append('phone', values.phone)
        formData.append('eventId', values.eventId)
        formData.append('receipt', receiptFile)

        res = await fetch('/api/register-event', {
          method: 'POST',
          body: formData,
        })
      } else {
        // Send JSON for free registration
        res = await fetch('/api/register-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmittedName(values.name.split(' ')[0])
      setIsPendingSuccess(!!data.isPending)
      setIsSuccess(true)
      router.refresh()
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isPendingSuccess ? (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shadow-md">
              <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Registration Received, {submittedName}! ⏳
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed mb-4">
              Thank you for uploading your payment receipt! Our team is currently verifying your
              payment. You will receive an email confirmation once verified.
            </p>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-4 max-w-sm text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="h-4 w-4" />
                Payment Verification In Progress
              </p>
              <p>We review receipts promptly. Check your inbox for updates!</p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shadow-md">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              You&apos;re registered, {submittedName}! 🎉
            </h2>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              A confirmation email has been sent to your inbox. We can&apos;t wait to see you at the
              run!
            </p>
          </>
        )}

        <Button
          variant="outline"
          className="mt-8 hover:border-[#E93998] hover:text-[#E93998] transition-colors"
          onClick={() => {
            setIsSuccess(false)
            setIsPendingSuccess(false)
            handleClearReceipt()
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
                  className="h-11 focus-visible:ring-[#E93998]"
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
                  className="h-11 focus-visible:ring-[#E93998]"
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
                  className="h-11 focus-visible:ring-[#E93998]"
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
              <Select
                onValueChange={(val) => {
                  field.onChange(val)
                  handleClearReceipt()
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full h-11 focus:ring-[#E93998]">
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

                      const hasPayment = !!event.paymentQrImageUrl

                      return (
                        <SelectItem
                          key={event.id}
                          value={event.id}
                          textValue={event.name}
                          disabled={isDisabled}
                          className="py-3"
                        >
                          <div className="flex flex-col gap-0.5 w-full">
                            <span className="font-medium flex items-center justify-between gap-2">
                              <span>
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

                              {hasPayment && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 text-[10px] font-semibold text-[#E93998] border border-pink-200 dark:border-pink-800">
                                  <QrCode className="h-3 w-3" />
                                  Commitment Fee
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

        {/* SHADCN ACCORDION FOR PAYMENT (Renders if event has payment QR code) */}
        {requiresPayment && selectedEvent?.paymentQrImageUrl && (
          <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="w-full"
          >
            <AccordionItem
              value="payment"
              className="rounded-xl border border-pink-200 bg-pink-50/40 dark:border-pink-900/60 dark:bg-pink-950/20 overflow-hidden shadow-xs px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4 text-left gap-2">
                <div className="flex items-center gap-2.5">
                  <div>
                    <span className="text-sm font-semibold text-foreground flex-col sm:flex-row items-center gap-2">
                      Payment & Receipt Upload
                    </span>
                    <p className="text-xs text-muted-foreground font-normal">
                      Scan DuitNow QR & upload transaction receipt screenshot
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="space-y-4 pt-1 pb-5">
                {/* Payment Instructions / Copy */}
                <div className="rounded-lg bg-white dark:bg-zinc-900 p-3.5 border border-pink-100 dark:border-zinc-800 text-xs text-muted-foreground leading-relaxed shadow-xs">
                  {selectedEvent.paymentInstructions ? (
                    <div className="whitespace-pre-line text-foreground">
                      {selectedEvent.paymentInstructions}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-[#E93998]" />
                        Commitment Fee & Verification
                      </p>
                      <p>
                        Hey girl! 💗 To help us guarantee a full headcount for our event
                        collaborators, we collect a small commitment fee to reserve your slot.
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pt-1 text-foreground">
                        <li>
                          Scan the <strong>DuitNow QR code</strong> below to complete your payment.
                        </li>
                        <li>Upload your payment receipt screenshot below.</li>
                        <li>Our team will verify your receipt and confirm your spot!</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* QR Image with White BG Container and No Bottom Border */}
                <div className="w-full rounded-xl p-3 flex flex-col items-center justify-center shadow-none my-1">
                  <a
                    href={selectedEvent.paymentQrImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block w-full rounded-lg overflow-hidden hover:opacity-95 transition-opacity cursor-zoom-in"
                    title="Click to open full size QR image"
                  >
                    <Image
                      src={selectedEvent.paymentQrImageUrl}
                      alt="DuitNow Payment QR Code"
                      width={800}
                      height={800}
                      className="w-full h-auto rounded-lg block border-0"
                    />
                  </a>
                </div>

                {/* Receipt Upload Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-foreground">
                    Upload Payment Receipt Screenshot <span className="text-destructive">*</span>
                  </label>

                  {receiptFile ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {receiptPreviewUrl ? (
                          <div className="relative h-12 w-12 rounded overflow-hidden border border-emerald-300 shrink-0">
                            <Image
                              src={receiptPreviewUrl}
                              alt="Receipt Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-emerald-200 dark:bg-emerald-900 flex items-center justify-center shrink-0 text-emerald-800 dark:text-emerald-200">
                            <FileCheck className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 truncate">
                            {receiptFile.name}
                          </p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            {(receiptFile.size / 1024 / 1024).toFixed(2)} MB · Ready to upload
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClearReceipt}
                        className="h-8 w-8 text-emerald-700 dark:text-emerald-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-pink-300 dark:border-pink-800 rounded-xl cursor-pointer bg-white dark:bg-zinc-900 hover:bg-pink-50/50 dark:hover:bg-zinc-800/60 transition-colors p-4 text-center">
                      <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <Upload className="w-6 h-6 mb-1.5 text-[#E93998]" />
                        <p className="text-xs font-medium text-foreground">
                          <span className="font-bold text-[#E93998]">Click to upload</span> or drag
                          receipt here
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          PNG, JPG, WEBP, or PDF (Max 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleReceiptChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* PDPA Consent Notice */}
        <p className="text-[11px] text-muted-foreground text-center my-3 leading-normal">
          By submitting this form, you consent to oneseventycadence processing your personal data in
          accordance with our{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="text-[#E93998] font-semibold hover:underline"
          >
            PDPA Privacy Notice
          </Link>
          .
        </p>

        <Button
          type="submit"
          className="w-full h-11 mt-2 font-semibold bg-[#E93998] hover:bg-[#d02882] text-white shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {requiresPayment ? 'Uploading Receipt & Registering...' : 'Registering...'}
            </>
          ) : requiresPayment ? (
            'Submit Registration & Receipt'
          ) : (
            'Register Now'
          )}
        </Button>
      </form>
    </Form>
  )
}
