'use client'

import React, { useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { toast } from '@payloadcms/ui'

export function AttendedCell(props: DefaultCellComponentProps) {
  const { cellData, rowData } = props
  const [checked, setChecked] = useState<boolean>(!!cellData)
  const [loading, setLoading] = useState<boolean>(false)

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = e.target.checked
    setLoading(true)
    setChecked(nextChecked) // optimistic update

    try {
      const res = await fetch(`/api/registrations/${rowData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attended: nextChecked,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update registration status')
      }

      toast.success(
        nextChecked
          ? `Marked ${rowData.name} as attended`
          : `Removed attendance for ${rowData.name}`
      )
      
      // Dispatch a custom event to notify other components (e.g. RegistrationsListHeader)
      window.dispatchEvent(new CustomEvent('registration-updated'))
    } catch (err) {
      console.error(err)
      setChecked(!nextChecked) // revert state
      toast.error('Failed to update attendance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={loading}
        onChange={handleToggle}
        style={{
          height: '16px',
          width: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          accentColor: '#E93998', // Brand pink!
          opacity: loading ? 0.5 : 1,
        }}
      />
    </div>
  )
}
