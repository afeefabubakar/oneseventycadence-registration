'use client'

import React, { useEffect, useState } from 'react'
import { useListQuery } from '@payloadcms/ui'

export function RegistrationsListHeader() {
  const { data, query } = useListQuery()
  const [stats, setStats] = useState({
    attended: 0,
    confirmed: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const queryJson = JSON.stringify(query?.where)

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger((prev) => prev + 1)
    }
    window.addEventListener('registration-updated', handleUpdate)
    return () => {
      window.removeEventListener('registration-updated', handleUpdate)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function fetchStats() {
      setLoading(true)
      try {
        const baseWhere = query?.where

        const attendedQuery = baseWhere
          ? { and: [baseWhere, { attended: { equals: true } }] }
          : { attended: { equals: true } }

        const confirmedQuery = baseWhere
          ? { and: [baseWhere, { status: { equals: 'confirmed' } }] }
          : { status: { equals: 'confirmed' } }

        const cancelledQuery = baseWhere
          ? { and: [baseWhere, { status: { equals: 'cancelled' } }] }
          : { status: { equals: 'cancelled' } }

        const [attendedRes, confirmedRes, cancelledRes] = await Promise.all([
          fetch(
            `/api/registrations?where=${encodeURIComponent(JSON.stringify(attendedQuery))}&limit=1`,
          ),
          fetch(
            `/api/registrations?where=${encodeURIComponent(JSON.stringify(confirmedQuery))}&limit=1`,
          ),
          fetch(
            `/api/registrations?where=${encodeURIComponent(JSON.stringify(cancelledQuery))}&limit=1`,
          ),
        ])

        if (!attendedRes.ok || !confirmedRes.ok || !cancelledRes.ok) {
          throw new Error('Failed to fetch statistics')
        }

        const [attendedData, confirmedData, cancelledData] = await Promise.all([
          attendedRes.json(),
          confirmedRes.json(),
          cancelledRes.json(),
        ])

        if (active) {
          setStats({
            attended: attendedData.totalDocs || 0,
            confirmed: confirmedData.totalDocs || 0,
            cancelled: cancelledData.totalDocs || 0,
          })
        }
      } catch (err) {
        console.error('Error fetching registration stats:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      active = false
    }
  }, [queryJson, refreshTrigger])

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
      {/* Total Card */}
      <div
        style={{
          flex: '1',
          minWidth: '150px',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-150, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--theme-elevation-400, #64748b)',
            margin: 0,
          }}
        >
          Total
        </h4>
        <p
          style={{
            marginTop: '4px',
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--theme-elevation-900, #0f172a)',
            margin: 0,
          }}
        >
          {data?.totalDocs ?? 0}
        </p>
      </div>

      {/* Attended Card */}
      <div
        style={{
          flex: '1',
          minWidth: '150px',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-150, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--theme-elevation-400, #64748b)',
            margin: 0,
          }}
        >
          Attended
        </h4>
        <p
          style={{
            marginTop: '4px',
            fontSize: '28px',
            fontWeight: 800,
            margin: 0,
          }}
        >
          {stats.attended}
        </p>
      </div>

      {/* Confirmed Card */}
      {/* <div
        style={{
          flex: '1',
          minWidth: '150px',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-150, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--theme-elevation-400, #64748b)',
            margin: 0,
          }}
        >
          Confirmed
        </h4>
        <p
          style={{
            marginTop: '4px',
            fontSize: '28px',
            fontWeight: 800,
            color: '#2563eb',
            margin: 0,
          }}
        >
          {stats.confirmed}
        </p>
      </div> */}

      {/* Cancelled Card */}
      {/* <div
        style={{
          flex: '1',
          minWidth: '150px',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-150, #e2e8f0)',
          padding: '16px 20px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--theme-elevation-400, #64748b)',
            margin: 0,
          }}
        >
          Cancelled
        </h4>
        <p
          style={{
            marginTop: '4px',
            fontSize: '28px',
            fontWeight: 800,
            color: '#dc2626',
            margin: 0,
          }}
        >
          {stats.cancelled}
        </p>
      </div> */}
    </div>
  )
}
