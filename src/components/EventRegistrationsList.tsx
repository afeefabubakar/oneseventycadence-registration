'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useDocumentInfo, toast } from '@payloadcms/ui'
import { 
  Search, 
  Mail, 
  Phone, 
  User, 
  ExternalLink, 
  Check, 
  X, 
  RefreshCw, 
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  CheckCheck,
  DollarSign
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
  refundToken?: string
  attended: boolean
  createdAt: string
}

export function EventRegistrationsList() {
  const { id } = useDocumentInfo()
  const [mounted, setMounted] = useState<boolean>(false)
  const [isCancelled, setIsCancelled] = useState<boolean>(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [attendedFilter, setAttendedFilter] = useState<string>('all')
  const [refundFilter, setRefundFilter] = useState<string>('all')
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [viewingQrUrl, setViewingQrUrl] = useState<string | null>(null)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch event cancellation status & registrations
  useEffect(() => {
    if (!id) return

    let active = true
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch event info to check isCancelled
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          if (active && eventData) {
            setIsCancelled(Boolean(eventData.isCancelled))
          }
        }

        // Fetch registrations
        const query = { event: { equals: id } }
        const url = `/api/registrations?where=${encodeURIComponent(
          JSON.stringify(query)
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

  // Filter registrations based on search and dropdown filters
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesSearch =
        reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.refundBank && reg.refundBank.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (reg.refundAccountName && reg.refundAccountName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (reg.refundAccountNumber && reg.refundAccountNumber.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesAttended =
        attendedFilter === 'all' ||
        (attendedFilter === 'attended' && reg.attended) ||
        (attendedFilter === 'not-attended' && !reg.attended)

      const matchesRefund =
        !isCancelled ||
        refundFilter === 'all' ||
        (refundFilter === 'requested' && reg.refundStatus === 'requested') ||
        (refundFilter === 'refunded' && reg.refundStatus === 'refunded') ||
        (refundFilter === 'not_requested' && (reg.refundStatus === 'not_requested' || !reg.refundStatus))

      return matchesSearch && matchesAttended && matchesRefund
    })
  }, [registrations, searchQuery, attendedFilter, refundFilter, isCancelled])

  // Calculate statistics from the full set of registrations
  const stats = useMemo(() => {
    const total = registrations.length
    const attended = registrations.filter((r) => r.attended).length
    const noShow = total - attended
    const attendedPercentage = total > 0 ? Math.round((attended / total) * 100) : 0
    const refundRequested = registrations.filter((r) => r.refundStatus === 'requested').length
    const refunded = registrations.filter((r) => r.refundStatus === 'refunded').length

    return { total, attended, noShow, attendedPercentage, refundRequested, refunded }
  }, [registrations])

  // Toggle attended state
  const handleToggleAttended = async (regId: string, currentVal: boolean) => {
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
        prev.map((reg) => (reg.id === regId ? { ...reg, attended: newVal } : reg))
      )

      toast.success(
        newVal
          ? 'Marked registrant as attended'
          : 'Removed attendance for registrant'
      )
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
          refundedAt: newStatus === 'refunded' ? new Date().toISOString() : null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update refund status')
      }

      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === regId
            ? { ...reg, refundStatus: newStatus as any }
            : reg
        )
      )

      if (newStatus === 'refunded') {
        toast.success('Marked as Refunded! Confirmation email sent to attendee.')
      } else {
        toast.success('Refund status updated.')
      }
    } catch (err) {
      console.error(err)
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

  return (
    <div
      style={{
        marginTop: '48px',
        paddingTop: '32px',
        borderTop: '2px solid var(--theme-elevation-200, #e2e8f0)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Title Header */}
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
            Event Registrations ({registrations.length})
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-0, #ffffff)',
            border: '1px solid var(--theme-elevation-150, #e2e8f0)',
            borderRadius: '6px',
            padding: '12px 16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-500, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Registered
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--theme-elevation-900, #0f172a)' }}>
            {stats.total}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--theme-elevation-0, #ffffff)',
            border: '1px solid var(--theme-elevation-150, #e2e8f0)',
            borderRadius: '6px',
            padding: '12px 16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-500, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
            Attended
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#16a34a' }}>
            {stats.attended} ({stats.attendedPercentage}%)
          </div>
        </div>

        {isCancelled ? (
          <>
            <div
              style={{
                backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                border: '1px solid var(--theme-elevation-150, #e2e8f0)',
                borderRadius: '6px',
                padding: '12px 16px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>
                Refund Requested
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#d97706' }}>
                {stats.refundRequested}
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                border: '1px solid var(--theme-elevation-150, #e2e8f0)',
                borderRadius: '6px',
                padding: '12px 16px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>
                Refunded
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#16a34a' }}>
                {stats.refunded}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Filters and Search */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--theme-elevation-400, #94a3b8)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-250, #cbd5e1)',
              backgroundColor: 'var(--theme-elevation-0, #ffffff)',
              color: 'var(--theme-elevation-800, #0f172a)',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={attendedFilter}
          onChange={(e) => setAttendedFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--theme-elevation-250, #cbd5e1)',
            backgroundColor: 'var(--theme-elevation-0, #ffffff)',
            color: 'var(--theme-elevation-800, #0f172a)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="all">Attended: All</option>
          <option value="yes">Attended: Yes</option>
          <option value="no">Attended: No</option>
        </select>

        {isCancelled && (
          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-250, #cbd5e1)',
              backgroundColor: 'var(--theme-elevation-0, #ffffff)',
              color: 'var(--theme-elevation-800, #0f172a)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="all">Refund: All</option>
            <option value="requested">Refund: Requested</option>
            <option value="refunded">Refund: Refunded</option>
            <option value="not_requested">Refund: Not Requested</option>
          </select>
        )}
      </div>

      {/* Registrations Table / List */}
      <div
        style={{
          border: '1px solid var(--theme-elevation-150, #e2e8f0)',
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: 'var(--theme-elevation-0, #ffffff)',
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-elevation-500, #64748b)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            Loading registrations...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-elevation-500, #64748b)' }}>
            <p style={{ margin: 0 }}>No registrations found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="event-registrations-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)', width: '80px' }}>Amount</th>
                  {isCancelled && <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)', width: '220px' }}>Refund Details</th>}
                  {isCancelled && <th style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)', width: '80px' }}>Refunded</th>}
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)', width: '80px' }}>Attended</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)', width: '130px' }}>Registered At</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', color: 'var(--theme-elevation-500, #64748b)', width: '60px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const isAttendedLoading = actionLoading[`attended-${reg.id}`]
                  const isRefundLoading = actionLoading[`refund-${reg.id}`]
                  const isRefunded = reg.refundStatus === 'refunded'
                  const bankInfoString = reg.refundBank && reg.refundAccountNumber
                    ? `${reg.refundBank} - ${reg.refundAccountName} (${reg.refundAccountNumber})`
                    : ''

                  return (
                    <tr key={reg.id} style={{ borderTop: '1px solid var(--theme-elevation-150, #e2e8f0)' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{reg.name}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {reg.email}<br />{reg.phone}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>{reg.amount ? `RM ${reg.amount}` : '-'}</td>

                      {isCancelled && (
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {/* Bank Transfer Submission */}
                            {!reg.refundQrImage && reg.refundBank && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--theme-elevation-700, #334155)',
                                  backgroundColor: 'var(--theme-elevation-100, #f8fafc)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--theme-elevation-200, #e2e8f0)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                                  <strong>{reg.refundBank}</strong>: {reg.refundAccountName} ({reg.refundAccountNumber})
                                </span>
                                <button
                                  type="button"
                                  title="Copy Bank Details"
                                  onClick={() => copyToClipboard(bankInfoString, reg.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: copiedId === reg.id ? '#16a34a' : '#64748b',
                                    padding: 0,
                                  }}
                                >
                                  {copiedId === reg.id ? <CheckCheck size={13} /> : <Copy size={13} />}
                                </button>
                              </div>
                            )}

                            {/* DuitNow QR Upload Submission */}
                            {reg.refundQrImage && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {reg.refundAccountName && (
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-elevation-800, #1e293b)' }}>
                                    {reg.refundAccountName}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setViewingQrUrl(typeof reg.refundQrImage === 'object' ? reg.refundQrImage.url : reg.refundQrImage)}
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
                              </div>
                            )}

                            {!reg.refundBank && !reg.refundQrImage && (
                              <span style={{ fontSize: '12px', color: 'var(--theme-elevation-400, #94a3b8)' }}>-</span>
                            )}
                          </div>
                        </td>
                      )}



                      {isCancelled && (
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isRefunded}
                            disabled={isRefundLoading}
                            onChange={() => handleToggleRefunded(reg.id, reg.refundStatus)}
                            style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                          />
                        </td>
                      )}

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={reg.attended}
                          disabled={isAttendedLoading}
                          onChange={() => handleToggleAttended(reg.id, reg.attended)}
                          style={{ cursor: 'pointer', accentColor: '#E93998' }}
                        />
                      </td>

                      <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                        {new Date(reg.createdAt).toLocaleDateString('en-MY')}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <a href={`/admin/collections/registrations/${reg.id}`} style={{ color: '#64748b' }}>
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

      {/* DuitNow QR Image View Modal */}
      {viewingQrUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>DuitNow QR Code</h4>
              <button
                type="button"
                onClick={() => setViewingQrUrl(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <img src={viewingQrUrl} alt="Attendee DuitNow QR Code" style={{ width: '100%', height: 'auto', maxHeight: '320px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', margin: '12px 0 0 0' }}>
              Scan this QR code using your banking app to process the refund.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
