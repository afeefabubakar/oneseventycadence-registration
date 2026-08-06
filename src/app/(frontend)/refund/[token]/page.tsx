'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
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
} from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export default function RefundPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const token = resolvedParams.token

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  // Form states
  const [accountName, setAccountName] = useState('')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null)
  const [qrImageId, setQrImageId] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [editMode, setEditMode] = useState(false)

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
        setAccountName(reg.refundAccountName || reg.name || '')
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
  }, [token])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQrFile(file)
      setQrPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountName || !accountName.trim()) {
      alert('Please enter your Account Holder Name.')
      return
    }

    if (!qrFile && !qrPreviewUrl && !qrImageId) {
      alert('Please upload a screenshot of your DuitNow QR code.')
      return
    }

    setSubmitting(true)
    try {
      let uploadedQrId = qrImageId

      // Upload QR image if a new file was selected
      if (qrFile) {
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

      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          accountName: accountName.trim(),
          qrImageId: uploadedQrId,
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
        refundAccountName: accountName.trim(),
        refundQrImageUrl: qrPreviewUrl,
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
                Your refund for <strong>{event?.name}</strong> has been successfully processed and transferred via DuitNow QR.
              </p>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-left mb-6 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-semibold text-gray-900">{data.refundAccountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-semibold text-gray-900">DuitNow QR Scan</span>
                </div>
              </div>
            </div>
          ) : isRequested ? (
            /* STATE 2: REQUESTED & PENDING PROCESSING */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">DuitNow QR Submitted</h2>
              <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                We have received your DuitNow QR code. Our finance team will scan your QR code and process your instant refund shortly.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-6 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-semibold text-gray-900">{data.refundAccountName}</span>
                </div>
                {qrPreviewUrl && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-600 block mb-1">Uploaded DuitNow QR Image:</span>
                    <img src={qrPreviewUrl} alt="DuitNow QR Code" className="w-32 h-32 object-contain rounded-lg border border-gray-300 mx-auto" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Update DuitNow QR Code
              </button>
            </div>
          ) : (
            /* STATE 3: SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload DuitNow QR Code</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a screenshot of your personal DuitNow QR code from your banking app or eWallet for your instant refund.
                </p>
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Account Holder Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full name as registered on DuitNow QR"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E93998] focus:ring-1 focus:ring-[#E93998]"
                  />
                </div>
              </div>

              {/* DUITNOW QR CODE IMAGE UPLOAD */}
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
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)' }}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit DuitNow QR
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Your information is encrypted & used strictly for refund processing.
              </p>
            </form>
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
