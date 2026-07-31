'use client'

import React from 'react'

export function PaymentSectionSeparator() {
  return (
    <div
      style={{
        marginTop: '32px',
        marginBottom: '20px',
        paddingTop: '20px',
        borderTop: '1px solid var(--theme-elevation-150, #e2e8f0)',
        fontFamily: 'Inter, system-ui, sans-serif',
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
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-800, #1e293b)',
            margin: 0,
          }}
        >
          Payment & Fee Configuration
        </h3>
      </div>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--theme-elevation-500, #64748b)',
          margin: '4px 0 0 12px',
        }}
      >
        Configure DuitNow QR payment requirement and fee amount for this event.
      </p>
    </div>
  )
}
