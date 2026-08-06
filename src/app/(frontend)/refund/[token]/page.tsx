'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CreditCard,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Edit2,
  QrCode,
  ChevronDown,
} from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const MALAYSIAN_BANKS = [
  'Maybank (Malayan Banking Berhad)',
  'CIMB Bank',
  'Public Bank',
  'RHB Bank',
  'Hong Leong Bank',
  'AmBank',
  'Bank Islam Malaysia',
  'Touch n Go eWallet (DuitNow)',
  'Alliance Bank',
  'Affin Bank',
  'Bank Muamalat',
  'OCBC Bank Malaysia',
  'HSBC Bank Malaysia',
  'Standard Chartered Bank',
  'UOB Malaysia',
  'Agrobank',
  'BSN (Bank Simpanan Nasional)',
  'Other / Overseas Bank',
]

const refundFormSchema = z
  .object({
    duitnowType: z.enum(['account', 'qr']),
    accountName: z.string().min(2, 'Account holder full name is required.'),
    bankName: z.string().optional(),
    customBankName: z.string().optional(),
    accountNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.duitnowType === 'account') {
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bankName'],
          message: 'Please select a bank.',
        })
      }
      if (data.bankName === 'Other / Overseas Bank' && (!data.customBankName || !data.customBankName.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customBankName'],
          message: 'Please specify bank provider name.',
        })
      }
      if (!data.accountNumber || !data.accountNumber.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountNumber'],
          message: 'Account number is required.',
        })
      }
    }
  })

type RefundFormValues = z.infer<typeof refundFormSchema>

interface PageProps {
  params: Promise<{ token: string }>
}

export default function RefundPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const token = resolvedParams.token

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  // QR Upload File states
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null)
  const [qrImageId, setQrImageId] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      duitnowType: 'account',
      accountName: '',
      bankName: MALAYSIAN_BANKS[0],
      customBankName: '',
      accountNumber: '',
    },
  })

  const watchDuitnowType = form.watch('duitnowType')
  const watchBankName = form.watch('bankName')

  useEffect(() => {
    async function fetchRefundDetails() {
      try {
        setLoading(true)
        const res = await fetch(`/api/refund?token=${encodeURIComponent(token)}`)
        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Invalid or expired refund link.')
        }

        const reg = json.registration
        setData(reg)

        form.reset({
          duitnowType: (reg.refundDuitnowType as any) || 'account',
          accountName: reg.refundAccountName || reg.name || '',
          bankName: reg.refundBank || MALAYSIAN_BANKS[0],
          customBankName: '',
          accountNumber: reg.refundAccountNumber || '',
        })

        if (reg.refundQrImageUrl) {
          setQrPreviewUrl(reg.refundQrImageUrl)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load refund details')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchRefundDetails()
    }
  }, [token, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQrFile(file)
      setQrPreviewUrl(URL.createObjectURL(file))
      setQrError(null)
    }
  }

  const onSubmit = async (values: RefundFormValues) => {
    if (values.duitnowType === 'qr' && !qrFile && !qrPreviewUrl && !qrImageId) {
      setQrError('Please upload a screenshot of your DuitNow QR code.')
      return
    }

    setSubmitting(true)
    try {
      let uploadedQrId = qrImageId

      if (values.duitnowType === 'qr' && qrFile) {
        const formData = new FormData()
        formData.append('file', qrFile)
        const uploadRes = await fetch('/api/refund-qrs', {
          method: 'POST',
          body: formData,
        })
        const uploadJson = await uploadRes.json()
        if (uploadRes.ok && uploadJson.doc?.id) {
          uploadedQrId = uploadJson.doc.id
          setQrImageId(uploadedQrId)
        } else {
          throw new Error('Failed to upload DuitNow QR image.')
        }
      }

      const finalBank = values.bankName === 'Other / Overseas Bank' ? values.customBankName : values.bankName

      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          bankName: values.duitnowType === 'account' ? finalBank?.trim() : 'DuitNow QR',
          accountName: values.accountName.trim(),
          accountNumber: values.duitnowType === 'account' ? values.accountNumber?.trim() : 'QR Code Uploaded',
          duitnowType: values.duitnowType,
          qrImageId: values.duitnowType === 'qr' ? uploadedQrId : undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit refund request.')
      }

      setSubmitSuccess(true)
      setEditMode(false)
      setData((prev: any) => ({
        ...prev,
        refundStatus: 'requested',
        refundBank: values.duitnowType === 'account' ? finalBank?.trim() : 'DuitNow QR',
        refundAccountName: values.accountName.trim(),
        refundAccountNumber: values.duitnowType === 'account' ? values.accountNumber?.trim() : 'QR Code Uploaded',
        refundDuitnowType: values.duitnowType,
        refundQrImageUrl: values.duitnowType === 'qr' ? qrPreviewUrl : null,
      }))
    } catch (err: any) {
      alert(err.message || 'Error submitting refund request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#E93998] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying your secure refund link...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between py-12 px-4">
        <div className="max-w-md w-full mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {error || 'This refund request link is invalid or has expired. Please check the link in your email or contact support.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const { name, email, amount, refundStatus, event } = data
  const isRefunded = refundStatus === 'refunded'
  const isRequested = (refundStatus === 'requested' || submitSuccess) && !editMode

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Pink Top Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 w-full z-50"
        style={{ background: 'linear-gradient(90deg, #E93998, #f472b6, #E93998)' }}
      />

      <div className="max-w-xl w-full mx-auto relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md mx-auto"
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
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#E93998' }}>
            oneseventycadence
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Refund Request Portal
          </p>
        </div>

        {/* Event Card */}
        {event && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  Event Notice
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{event.name}</h3>
              </div>
              {amount && amount > 0 && (
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Refund Amount</span>
                  <span className="text-xl font-extrabold text-gray-900">RM {amount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Registered Attendee Banner */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 text-xs">
            <div>
              <span className="text-gray-500 block">Participant Name</span>
              <span className="font-semibold text-gray-900 text-sm">{name}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 block">Email Address</span>
              <span className="font-semibold text-gray-900 text-sm">{email}</span>
            </div>
          </div>

          {/* STATE 1: ALREADY REFUNDED */}
          {isRefunded ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Refund Completed</h2>
              <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                Your refund for <strong>{event?.name}</strong> has been successfully processed and transferred.
              </p>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-left mb-6 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-semibold text-gray-900">{data.refundAccountName}</span>
                </div>
                {data.refundDuitnowType === 'account' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-semibold text-gray-900">{data.refundBank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-semibold text-gray-900">{data.refundAccountNumber}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-semibold text-gray-900">DuitNow QR Scan</span>
                  </div>
                )}
              </div>
            </div>
          ) : isRequested ? (
            /* STATE 2: REQUESTED & PENDING PROCESSING */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Refund Request Submitted</h2>
              <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                We have received your payment details. Our finance team will process your refund transfer shortly.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-6 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-semibold text-gray-900">{data.refundAccountName}</span>
                </div>
                {data.refundDuitnowType === 'account' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-semibold text-gray-900">{data.refundBank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-semibold text-gray-900">{data.refundAccountNumber}</span>
                    </div>
                  </>
                ) : (
                  qrPreviewUrl && (
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-600 block mb-1">Uploaded DuitNow QR Image:</span>
                      <img src={qrPreviewUrl} alt="DuitNow QR Code" className="w-32 h-32 object-contain rounded-lg border border-gray-300 mx-auto" />
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Update Payment Details
              </button>
            </div>
          ) : (
            /* STATE 3: SUBMISSION FORM WITH REACT-HOOK-FORM + ZOD */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Enter Payment Details</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose your preferred refund method (Bank Account Transfer or Upload DuitNow QR).
                  </p>
                </div>

                {/* Transfer Method Selector */}
                <FormField
                  control={form.control}
                  name="duitnowType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">Refund Method</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { id: 'account', label: 'Bank Account' },
                            { id: 'qr', label: 'Upload DuitNow QR' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => field.onChange(item.id)}
                              className={`p-3 rounded-xl border text-center font-medium transition cursor-pointer ${
                                field.value === item.id
                                  ? 'border-[#E93998] bg-rose-50/50 text-[#E93998] font-bold'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Account Holder Name */}
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        Account Holder Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <Input
                            {...field}
                            placeholder="Full name as registered in bank / DuitNow"
                            className="pl-10 h-11 bg-gray-50 border-gray-300 rounded-xl text-xs focus-visible:ring-[#E93998]"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                {/* OPTION 1: BANK ACCOUNT DETAILS */}
                {watchDuitnowType === 'account' ? (
                  <>
                    {/* Bank Name Dropdown */}
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Selecting Bank Provider</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 z-10 pointer-events-none" />
                              <select
                                {...field}
                                className="w-full pl-10 pr-10 h-11 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 font-semibold appearance-none cursor-pointer focus:outline-none focus:border-[#E93998] focus:ring-1 focus:ring-[#E93998]"
                              >
                                {MALAYSIAN_BANKS.map((b) => (
                                  <option key={b} value={b}>
                                    {b}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />

                    {watchBankName === 'Other / Overseas Bank' && (
                      <FormField
                        control={form.control}
                        name="customBankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-700">Specify Bank / Overseas Provider Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. Wise, Revolut, HSBC UK..."
                                className="h-11 bg-gray-50 border-gray-300 rounded-xl text-xs focus-visible:ring-[#E93998]"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Account Number */}
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Bank Account Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                              <Input
                                {...field}
                                placeholder="e.g. 114012345678"
                                className="pl-10 h-11 bg-gray-50 border-gray-300 rounded-xl text-xs focus-visible:ring-[#E93998]"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  /* OPTION 2: DUITNOW QR CODE IMAGE UPLOAD */
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      DuitNow QR Screenshot / Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:border-[#E93998] transition relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {qrPreviewUrl ? (
                        <div className="flex flex-col items-center">
                          <img src={qrPreviewUrl} alt="DuitNow QR Code" className="w-36 h-36 object-contain rounded-lg border border-gray-200 mb-2 shadow-sm" />
                          <span className="text-xs text-[#E93998] font-semibold">Click or drag to change QR image</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <QrCode className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-xs font-semibold text-gray-700">Click to upload DuitNow QR code screenshot</span>
                          <span className="text-[11px] text-gray-400 mt-1">Supports PNG, JPG, JPEG</span>
                        </div>
                      )}
                    </div>
                    {qrError && <p className="text-xs text-red-500 mt-1.5 font-medium">{qrError}</p>}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl font-bold text-white text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Refund Request
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Your information is encrypted & used strictly for refund processing.
                </p>
              </form>
            </Form>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-400 space-y-2">
          <p>© {new Date().getFullYear()} oneseventycadence · All rights reserved</p>
        </footer>
      </div>
    </div>
  )
}
