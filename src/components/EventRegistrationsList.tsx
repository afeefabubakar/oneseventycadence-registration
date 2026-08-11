'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useDocumentInfo, toast } from '@payloadcms/ui'
import {
  Search,
  ExternalLink,
  RefreshCw,
  Plus,
  Users,
  QrCode,
  Copy,
  CheckCheck,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface Registration {
  id: string
  name: string
  email: string
  phone: string
  amount?: number
  status: 'confirmed' | 'cancelled' | 'pending' | 'declined'
  refundStatus?: 'not_requested' | 'requested' | 'refunded'
  refundBank?: string
  refundAccountName?: string
  refundAccountNumber?: string
  refundQrImage?: any
  refundDuitnowType?: 'account' | 'qr'
  refundToken?: string
  refundRequestedAt?: string
  refundedAt?: string
  attended: boolean
  createdAt: string
}

export function EventRegistrationsList() {
  const { id } = useDocumentInfo()
  const [mounted, setMounted] = useState<boolean>(false)
  const [isCancelled, setIsCancelled] = useState<boolean>(false)
  const [isPostponed, setIsPostponed] = useState<boolean>(false)

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Filters for Active Registrations table
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [attendedFilter, setAttendedFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filters for Refund Requests table
  const [refundSearchQuery, setRefundSearchQuery] = useState<string>('')
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('all')

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [viewingQrUrl, setViewingQrUrl] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch event cancellation/postponement status & registrations
  useEffect(() => {
    if (!id) return

    let active = true
    async function fetchData() {
      setLoading(true)
      try {
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          if (active && eventData) {
            setIsCancelled(Boolean(eventData.isCancelled))
            setIsPostponed(Boolean(eventData.isPostponed))
          }
        }

        const query = { event: { equals: id } }
        const url = `/api/registrations?where=${encodeURIComponent(
          JSON.stringify(query),
        )}&limit=1000&sort=-createdAt`

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Failed to fetch registrations')
        }

        const data = await res.json()
        if (active) {
          setRegistrations(data.docs || [])
        }
      } catch (err) {
        console.error('Error fetching registrations for event:', err)
        toast.error('Failed to load registrations for this event.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      active = false
    }
  }, [id, refreshTrigger])

  const isNoticeActive = isCancelled || isPostponed

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalAll = registrations.length
    const activeTotal = registrations.filter(
      (r) => r.refundStatus !== 'refunded' && r.status !== 'cancelled',
    ).length
    const attended = registrations.filter(
      (r) => r.attended && r.refundStatus !== 'refunded' && r.status !== 'cancelled',
    ).length
    const attendedPercentage = activeTotal > 0 ? Math.round((attended / activeTotal) * 100) : 0
    const refundRequested = registrations.filter((r) => r.refundStatus === 'requested').length
    const refunded = registrations.filter((r) => r.refundStatus === 'refunded').length

    return {
      totalAll,
      activeTotal,
      attended,
      attendedPercentage,
      refundRequested,
      refunded,
    }
  }, [registrations])

  // Active Registrations (Excludes refunded & cancelled from default view)
  const filteredActiveRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      // Exclude refund requested and refunded registrations from active table
      if (reg.refundStatus === 'requested' || reg.refundStatus === 'refunded') return false

      const matchesSearch =
        !searchQuery ||
        reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.phone.includes(searchQuery)

      const matchesAttended =
        attendedFilter === 'all' ||
        (attendedFilter === 'attended' && reg.attended) ||
        (attendedFilter === 'not-attended' && !reg.attended)

      const matchesStatus = statusFilter === 'all' || reg.status === statusFilter

      return matchesSearch && matchesAttended && matchesStatus
    })
  }, [registrations, searchQuery, attendedFilter, statusFilter])

  // Refund Requests (Only includes registrations with refundStatus requested or refunded)
  const filteredRefundRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const isRefundRecord = reg.refundStatus === 'requested' || reg.refundStatus === 'refunded'
      if (!isRefundRecord) return false

      const matchesSearch =
        !refundSearchQuery ||
        reg.name.toLowerCase().includes(refundSearchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(refundSearchQuery.toLowerCase()) ||
        reg.phone.includes(refundSearchQuery) ||
        (reg.refundBank &&
          reg.refundBank.toLowerCase().includes(refundSearchQuery.toLowerCase())) ||
        (reg.refundAccountName &&
          reg.refundAccountName.toLowerCase().includes(refundSearchQuery.toLowerCase())) ||
        (reg.refundAccountNumber &&
          reg.refundAccountNumber.toLowerCase().includes(refundSearchQuery.toLowerCase()))

      const matchesRefundStatus =
        refundStatusFilter === 'all' || reg.refundStatus === refundStatusFilter

      return matchesSearch && matchesRefundStatus
    })
  }, [registrations, refundSearchQuery, refundStatusFilter])

  // Toggle attended state
  const handleToggleAttended = async (regId: string | number, currentVal: boolean) => {
    setActionLoading((prev) => ({ ...prev, [`attended-${regId}`]: true }))
    const newVal = !currentVal

    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: newVal }),
      })

      if (!res.ok) {
        throw new Error('Failed to update attendance')
      }

      setRegistrations((prev) =>
        prev.map((reg) => (reg.id === regId ? { ...reg, attended: newVal } : reg)),
      )

      toast.success(newVal ? 'Marked registrant as attended' : 'Removed attendance for registrant')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update attendance status')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`attended-${regId}`]: false }))
    }
  }

  // Toggle Refunded Status
  const handleToggleRefunded = async (regId: string, currentRefundStatus?: string) => {
    const isRefunded = currentRefundStatus === 'refunded'
    const newStatus = isRefunded ? 'requested' : 'refunded'

    setActionLoading((prev) => ({ ...prev, [`refund-${regId}`]: true }))
    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundStatus: newStatus,
          status: 'cancelled',
          refundedAt: newStatus === 'refunded' ? new Date().toISOString() : null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update refund status')
      }

      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === regId
            ? {
                ...reg,
                refundStatus: newStatus as any,
                status: 'cancelled',
                refundedAt: newStatus === 'refunded' ? new Date().toISOString() : undefined,
              }
            : reg,
        ),
      )

      if (newStatus === 'refunded') {
        toast.success('Marked as Refunded! Status updated to Cancelled and email sent.')
      } else {
        toast.success('Refund status updated.')
      }
    } catch (err: any) {
      console.error('Error toggling refund status:', err)
      toast.error('Failed to update refund status')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`refund-${regId}`]: false }))
    }
  }

  const copyToClipboard = (text: string, regId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(regId)
    toast.success('Copied bank details to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!mounted) {
    return null
  }

  if (!id) {
    return (
      <div
        style={{
          border: '1px dashed var(--theme-elevation-250, #cbd5e1)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--theme-elevation-500, #64748b)',
          marginTop: '20px',
        }}
      >
        <Users size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
        <p style={{ margin: 0, fontWeight: 500 }}>
          This event is new. Please save the event first to view and manage registrations.
        </p>
      </div>
    )
  }

  const hasRefunds =
    isNoticeActive ||
    registrations.some((r) => r.refundStatus === 'requested' || r.refundStatus === 'refunded')

  return (
    <div
      style={{
        marginTop: '48px',
        paddingTop: '32px',
        borderTop: '2px solid var(--theme-elevation-200, #e2e8f0)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} style={{ color: '#E93998' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--theme-elevation-800, #0f172a)',
            }}
          >
            Event Registrations ({stats.activeTotal})
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-250, #cbd5e1)',
              backgroundColor: 'var(--theme-elevation-0, #ffffff)',
              color: 'var(--theme-elevation-700, #334155)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <a
            href={`/admin/collections/registrations/create?event=${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#E93998',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Plus size={14} />
            Add Registration
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-0, #ffffff)',
            border: '1px solid var(--theme-elevation-150, #e2e8f0)',
            borderRadius: '8px',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--theme-elevation-500, #64748b)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Confirmed Registration
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              marginTop: '4px',
              color: 'var(--theme-elevation-900, #0f172a)',
            }}
          >
            {stats.activeTotal}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--theme-elevation-0, #ffffff)',
            border: '1px solid var(--theme-elevation-150, #e2e8f0)',
            borderRadius: '8px',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--theme-elevation-500, #64748b)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Attended
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#16a34a' }}>
            {stats.attended} ({stats.attendedPercentage}%)
          </div>
        </div>

        {hasRefunds && (
          <>
            <div
              style={{
                backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#b45309',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Refund Requested
              </div>
              <div
                style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#b45309' }}
              >
                {stats.refundRequested}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#15803d',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Refunded
              </div>
              <div
                style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#15803d' }}
              >
                {stats.refunded}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: REFUND REQUESTS TABLE (Dedicated table for refund processing)  */}
      {/* ========================================================================= */}
      {hasRefunds && (
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  height: '14px',
                  width: '4px',
                  backgroundColor: '#E93998',
                  borderRadius: '2px',
                }}
              />
              <h4
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--theme-elevation-900, #0f172a)',
                }}
              >
                Refund Requests & Processing ({filteredRefundRegistrations.length})
              </h4>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--theme-elevation-400, #94a3b8)',
                  }}
                >
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search refund records..."
                  value={refundSearchQuery}
                  onChange={(e) => setRefundSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-250, #cbd5e1)',
                    backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                    color: 'var(--theme-elevation-800, #0f172a)',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={refundStatusFilter}
                onChange={(e) => setRefundStatusFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--theme-elevation-250, #cbd5e1)',
                  backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                  color: 'var(--theme-elevation-800, #0f172a)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Status: All Requests</option>
                <option value="requested">Pending Refund</option>
                <option value="refunded">Completed Refunded</option>
              </select>
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--theme-elevation-150, #e2e8f0)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--theme-elevation-0, #ffffff)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {filteredRefundRegistrations.length === 0 ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--theme-elevation-500, #64748b)',
                  fontSize: '13px',
                }}
              >
                No refund requests matching the current filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--theme-elevation-50, #f8fafc)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                        }}
                      >
                        Registrant
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                          width: '130px',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                        }}
                      >
                        Refund Method & Details
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                          width: '90px',
                        }}
                      >
                        Amount
                      </th>
                      <th
                        style={{
                          textAlign: 'center',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                          width: '90px',
                        }}
                      >
                        Refunded
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                          width: '120px',
                        }}
                      >
                        Requested At
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600, #475569)',
                          fontWeight: 600,
                          width: '60px',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefundRegistrations.map((reg) => {
                      const isRefundLoading = actionLoading[`refund-${reg.id}`]
                      const isRefunded = reg.refundStatus === 'refunded'

                      return (
                        <tr
                          key={reg.id}
                          style={{ borderTop: '1px solid var(--theme-elevation-150, #e2e8f0)' }}
                        >
                          {/* Registrant Name & Contact */}
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{reg.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {reg.email} · {reg.phone}
                            </div>
                          </td>

                          {/* Refund Status Badge */}
                          <td style={{ padding: '12px' }}>
                            {isRefunded ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#f1f5f9',
                                  color: '#475569',
                                }}
                              >
                                Refunded
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                }}
                              >
                                Refund Requested
                              </span>
                            )}
                          </td>

                          {/* Refund Method & Details */}
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* Bank Transfer Submission */}
                              {reg.refundDuitnowType !== 'qr' &&
                                reg.refundBank !== 'DuitNow QR' &&
                                reg.refundBank && (
                                  <div
                                    style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--theme-elevation-700, #334155)',
                                        fontWeight: 500,
                                      }}
                                    >
                                      <strong>{reg.refundBank}</strong>
                                      <br />
                                      {reg.refundAccountName}
                                    </span>
                                    {reg.refundAccountNumber && (
                                      <button
                                        type="button"
                                        title="Click to copy Account Number"
                                        onClick={() =>
                                          copyToClipboard(reg.refundAccountNumber || '', reg.id)
                                        }
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          fontFamily: 'monospace',
                                          color:
                                            copiedId === reg.id
                                              ? '#16a34a'
                                              : 'var(--theme-elevation-900, #0f172a)',
                                          backgroundColor:
                                            copiedId === reg.id
                                              ? 'rgba(22, 163, 74, 0.1)'
                                              : 'var(--theme-elevation-100, #f1f5f9)',
                                          border:
                                            copiedId === reg.id
                                              ? '1px solid #16a34a'
                                              : '1px solid var(--theme-elevation-300, #cbd5e1)',
                                          borderRadius: '4px',
                                          padding: '2px 8px',
                                          cursor: 'pointer',
                                          width: 'fit-content',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                        }}
                                      >
                                        <span>{reg.refundAccountNumber}</span>
                                        {copiedId === reg.id ? (
                                          <CheckCheck size={12} style={{ color: '#16a34a' }} />
                                        ) : (
                                          <Copy size={12} style={{ color: '#64748b' }} />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}

                              {/* DuitNow QR Upload Submission */}
                              {(reg.refundDuitnowType === 'qr' ||
                                reg.refundBank === 'DuitNow QR') && (
                                <div
                                  style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
                                >
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--theme-elevation-700, #334155)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <strong>DuitNow QR</strong>
                                    {reg.refundAccountName && (
                                      <>
                                        <br />
                                        {reg.refundAccountName}
                                      </>
                                    )}
                                  </span>
                                  {reg.refundQrImage ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setViewingQrUrl(
                                          typeof reg.refundQrImage === 'object'
                                            ? reg.refundQrImage.url
                                            : reg.refundQrImage,
                                        )
                                      }
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#E93998',
                                        border: '1px solid #E93998',
                                        borderRadius: '4px',
                                        background: 'rgba(233, 57, 152, 0.08)',
                                        cursor: 'pointer',
                                        padding: '3px 8px',
                                        width: 'fit-content',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <QrCode size={12} />
                                      View DuitNow QR
                                    </button>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        color: '#64748b',
                                        fontStyle: 'italic',
                                      }}
                                    >
                                      QR Code Purged (PDPA)
                                    </span>
                                  )}
                                </div>
                              )}

                              {!reg.refundBank &&
                                !reg.refundQrImage &&
                                reg.refundDuitnowType !== 'qr' && (
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--theme-elevation-400, #94a3b8)',
                                    }}
                                  >
                                    -
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#0f172a',
                            }}
                          >
                            {reg.amount ? `RM ${reg.amount}` : '-'}
                          </td>

                          {/* Mark as Refunded Checkbox */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isRefunded}
                              disabled={isRefundLoading}
                              onChange={() => handleToggleRefunded(reg.id, reg.refundStatus)}
                              style={{
                                cursor: 'pointer',
                                width: '16px',
                                height: '16px',
                                accentColor: '#16a34a',
                              }}
                            />
                          </td>

                          {/* Requested At Date */}
                          <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                            {reg.refundRequestedAt
                              ? new Date(reg.refundRequestedAt).toLocaleDateString('en-MY')
                              : new Date(reg.createdAt).toLocaleDateString('en-MY')}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <a
                              href={`/admin/collections/registrations/${reg.id}`}
                              style={{ color: '#64748b' }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ACTIVE REGISTRATIONS TABLE (Clean, un-crowded main table)      */}
      {/* ========================================================================= */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                height: '14px',
                width: '4px',
                backgroundColor: '#E93998',
                borderRadius: '2px',
              }}
            />
            <h4
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--theme-elevation-900, #0f172a)',
              }}
            >
              Active Registrations ({filteredActiveRegistrations.length})
            </h4>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--theme-elevation-400, #94a3b8)',
                }}
              >
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid var(--theme-elevation-250, #cbd5e1)',
                  backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                  color: 'var(--theme-elevation-800, #0f172a)',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--theme-elevation-250, #cbd5e1)',
                backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                color: 'var(--theme-elevation-800, #0f172a)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="all">Status: All</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={attendedFilter}
              onChange={(e) => setAttendedFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--theme-elevation-250, #cbd5e1)',
                backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                color: 'var(--theme-elevation-800, #0f172a)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="all">Attended: All</option>
              <option value="attended">Attended: Yes</option>
              <option value="not-attended">Attended: No</option>
            </select>
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--theme-elevation-150, #e2e8f0)',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'var(--theme-elevation-0, #ffffff)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--theme-elevation-500, #64748b)',
              }}
            >
              <RefreshCw
                size={24}
                className="animate-spin"
                style={{ margin: '0 auto 8px auto', display: 'block' }}
              />
              Loading registrations...
            </div>
          ) : filteredActiveRegistrations.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--theme-elevation-500, #64748b)',
                fontSize: '13px',
              }}
            >
              No active registrations found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                className="event-registrations-table"
                style={{ width: '100%', borderCollapse: 'collapse' }}
              >
                <thead>
                  <tr style={{ backgroundColor: 'var(--theme-elevation-50, #f8fafc)' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                      }}
                    >
                      Contact
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                        width: '130px',
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                        width: '90px',
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                        width: '80px',
                      }}
                    >
                      Attended
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                        width: '120px',
                      }}
                    >
                      Registered At
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--theme-elevation-600, #475569)',
                        fontWeight: 600,
                        width: '60px',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveRegistrations.map((reg) => {
                    const isAttendedLoading = actionLoading[`attended-${reg.id}`]

                    return (
                      <tr
                        key={reg.id}
                        style={{ borderTop: '1px solid var(--theme-elevation-150, #e2e8f0)' }}
                      >
                        <td
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        >
                          {reg.name}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          {reg.email}
                          <br />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{reg.phone}</span>
                        </td>

                        {/* Status Column */}
                        <td style={{ padding: '12px' }}>
                          {(() => {
                            if (reg.refundStatus === 'requested') {
                              return (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                  }}
                                >
                                  Refund Requested
                                </span>
                              )
                            }
                            if (reg.status === 'confirmed') {
                              return (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                  }}
                                >
                                  Confirmed
                                </span>
                              )
                            }
                            if (reg.status === 'pending') {
                              return (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#fef9c3',
                                    color: '#a16207',
                                  }}
                                >
                                  Pending
                                </span>
                              )
                            }
                            if (reg.status === 'declined') {
                              return (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#ffe4e6',
                                    color: '#be123c',
                                  }}
                                >
                                  Declined
                                </span>
                              )
                            }
                            if (reg.status === 'cancelled') {
                              return (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                  }}
                                >
                                  Cancelled
                                </span>
                              )
                            }
                            return (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                }}
                              >
                                {reg.status || '-'}
                              </span>
                            )
                          })()}
                        </td>

                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>
                          {reg.amount ? `RM ${reg.amount}` : '-'}
                        </td>

                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={reg.attended}
                            disabled={isAttendedLoading}
                            onChange={() => handleToggleAttended(reg.id, reg.attended)}
                            style={{
                              cursor: 'pointer',
                              width: '16px',
                              height: '16px',
                              accentColor: '#E93998',
                            }}
                          />
                        </td>

                        <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                          {new Date(reg.createdAt).toLocaleDateString('en-MY')}
                        </td>

                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <a
                            href={`/admin/collections/registrations/${reg.id}`}
                            style={{ color: '#64748b' }}
                          >
                            <ExternalLink size={16} />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DuitNow QR Image Viewer Modal */}
      {viewingQrUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setViewingQrUrl(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                DuitNow QR Code
              </h4>
              <button
                type="button"
                onClick={() => setViewingQrUrl(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={viewingQrUrl}
              alt="Attendee DuitNow QR Code"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '320px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            />
            <p
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '12px',
                margin: '12px 0 0 0',
              }}
            >
              Scan this QR code using your banking app to process the refund.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
