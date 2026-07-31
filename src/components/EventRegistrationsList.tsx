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
  QrCode
} from 'lucide-react'

interface Registration {
  id: string
  name: string
  email: string
  phone: string
  amount?: number
  status: 'confirmed' | 'cancelled' | 'pending' | 'declined'
  attended: boolean
  createdAt: string
}

export function EventRegistrationsList() {
  const { id } = useDocumentInfo()
  const [mounted, setMounted] = useState<boolean>(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [attendedFilter, setAttendedFilter] = useState<string>('all')
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch registrations if event ID exists
  useEffect(() => {
    if (!id) return

    let active = true
    async function fetchRegistrations() {
      setLoading(true)
      try {
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

    fetchRegistrations()

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
        reg.phone.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAttended =
        attendedFilter === 'all' ||
        (attendedFilter === 'attended' && reg.attended) ||
        (attendedFilter === 'not-attended' && !reg.attended)

      return matchesSearch && matchesAttended
    })
  }, [registrations, searchQuery, attendedFilter])

  // Calculate statistics from the full set of registrations
  const stats = useMemo(() => {
    const total = registrations.length
    const attended = registrations.filter((r) => r.attended).length
    const noShow = total - attended
    const attendedPercentage = total > 0 ? Math.round((attended / total) * 100) : 0
    const noShowPercentage = total > 0 ? Math.round((noShow / total) * 100) : 0

    return { total, attended, noShow, attendedPercentage, noShowPercentage }
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
        borderTop: '1px solid var(--theme-elevation-150, #cbd5e1)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header and Quick Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--theme-elevation-900, #0f172a)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Users size={20} style={{ color: '#E93998' }} />
            Event Registrations
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--theme-elevation-500, #64748b)',
              margin: '4px 0 0 0',
            }}
          >
            Manage registrations and check-in attendance for this event.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-200, #e2e8f0)',
              backgroundColor: 'var(--theme-elevation-100, #ffffff)',
              color: 'var(--theme-elevation-800, #1e293b)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <a
            href={`/admin/collections/registrations/create?event=${id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#E93998',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <Plus size={14} />
            Add Registrant
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
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
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
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
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
            Attended
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#16a34a' }}>
            {stats.attended}{' '}
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--theme-elevation-500, #64748b)' }}>
              ({stats.attendedPercentage}%)
            </span>
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
          <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>
            No Show
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#dc2626' }}>
            {stats.noShow}{' '}
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--theme-elevation-500, #64748b)' }}>
              ({stats.noShowPercentage}%)
            </span>
          </div>
        </div>
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
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-200, #cbd5e1)',
              backgroundColor: 'var(--theme-input-bg, var(--theme-elevation-0, #ffffff))',
              color: 'var(--theme-elevation-800, #1e293b)',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={attendedFilter}
            onChange={(e) => setAttendedFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-200, #cbd5e1)',
              backgroundColor: 'var(--theme-input-bg, var(--theme-elevation-0, #ffffff))',
              color: 'var(--theme-elevation-800, #1e293b)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All</option>
            <option value="attended">Attended</option>
            <option value="not-attended">Not Attended</option>
          </select>
        </div>
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
        ) : registrations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-elevation-500, #64748b)' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>No registrations found for this event.</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--theme-elevation-500, #64748b)' }}>
            <p style={{ margin: 0 }}>No registrations found matching the search/filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="event-registrations-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th style={{ width: '90px' }}>Amount</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Attended</th>
                  <th style={{ width: '150px' }}>Registered At</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const isAttendedLoading = actionLoading[`attended-${reg.id}`]

                  return (
                    <tr key={reg.id}>
                      {/* Name with link */}
                      <td>
                        <a
                          href={`/admin/collections/registrations/${reg.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {reg.name}
                          <ExternalLink size={12} style={{ opacity: 0.4 }} />
                        </a>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <a
                            href={`mailto:${reg.email}`}
                            style={{
                              color: 'var(--theme-elevation-500, #64748b)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Mail size={12} />
                            {reg.email}
                          </a>
                          <a
                            href={`tel:${reg.phone}`}
                            style={{
                              color: 'var(--theme-elevation-500, #64748b)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Phone size={12} />
                            {reg.phone}
                          </a>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ fontWeight: 600, color: 'var(--theme-elevation-800, #1e293b)' }}>
                        {reg.amount != null ? `RM ${reg.amount}` : '-'}
                      </td>

                      {/* Attended Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={reg.attended}
                          disabled={isAttendedLoading}
                          onChange={() => handleToggleAttended(reg.id, reg.attended)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: isAttendedLoading ? 'not-allowed' : 'pointer',
                            accentColor: '#E93998',
                            opacity: isAttendedLoading ? 0.5 : 1,
                          }}
                        />
                      </td>

                      {/* Registered Date */}
                      <td style={{ color: 'var(--theme-elevation-500, #64748b)' }}>
                        {new Date(reg.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions link to edit */}
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={`/admin/collections/registrations/${reg.id}`}
                          title="Edit Registration"
                          style={{
                            color: 'var(--theme-elevation-500, #64748b)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'color 0.15s, background-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#E93998'
                            e.currentTarget.style.backgroundColor = 'var(--theme-elevation-150, #f1f5f9)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--theme-elevation-500, #64748b)'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <ExternalLink size={14} />
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
  )
}
