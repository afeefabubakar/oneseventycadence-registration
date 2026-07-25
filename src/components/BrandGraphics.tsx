'use client'

import React from 'react'

export function BrandLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#E93998',
          borderRadius: '50%',
          width: '110px',
          height: '110px',
          boxShadow: '0 8px 16px rgba(233, 57, 152, 0.2)',
        }}
      >
        <img
          src="/images/osc-logo-white.PNG"
          alt="OneSeventyCadence Logo"
          style={{
            maxHeight: '65px',
            width: 'auto',
            display: 'block',
          }}
        />
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          color: '#E93998',
          textTransform: 'lowercase',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        oneseventycadence
      </div>
    </div>
  )
}

export function BrandIcon() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src="/images/osc-logo-black.PNG"
        alt="OneSeventyCadence Icon"
        style={{
          maxHeight: '30px',
          width: 'auto',
          display: 'block',
        }}
        className="osc-icon-light"
      />
      <img
        src="/images/osc-logo-white.PNG"
        alt="OneSeventyCadence Icon"
        style={{
          maxHeight: '30px',
          width: 'auto',
          display: 'none',
        }}
        className="osc-icon-dark"
      />
      <style>{`
        html[data-theme="dark"] .osc-icon-light { display: none !important; }
        html[data-theme="dark"] .osc-icon-dark { display: block !important; }
      `}</style>
    </div>
  )
}
