'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo, toast } from '@payloadcms/ui'
import { AlertTriangle, Send, X, RefreshCw, AlertCircle } from 'lucide-react'

function renderMarkdownPreview(text: string): string {
  if (!text || !text.trim()) return ''

  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" style="color: #E93998; text-decoration: underline;">$1</a>',
  )

  const blocks = html.split(/\n\s*\n/)

  return blocks
    .map((block) => {
      const lines = block.split('\n')
      const isBulletList =
        lines.length > 0 &&
        lines.every((line) => {
          const trimmed = line.trim()
          return trimmed.startsWith('* ') || trimmed.startsWith('- ')
        })

      if (isBulletList) {
        const items = lines
          .map((line) => {
            const content = line.trim().replace(/^[\*\-]\s+/, '')
            return `<li style="margin: 4px 0;">${content}</li>`
          })
          .join('')
        return `<ul style="margin: 12px 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.6;">${items}</ul>`
      }

      return `<p style="margin: 0 0 14px 0; font-size: 14px; color: #374151; line-height: 1.6;">${lines.join('<br />')}</p>`
    })
    .join('')
}

const DEFAULT_POSTPONED_TEMPLATE = `We regret to inform you that our upcoming run has been **postponed** to a later date. We are currently working closely with our collaborators to finalize the new date as soon as possible.

Here is what you need to know:
- **Your Slot is Secured**: Your registration is **automatically carried over** to the rescheduled event date. No further action is required if you plan to join us!
- **Full Refund Option**: If you are unable to attend on future date, you can request a full refund by clicking on the button below to fill up the refund request form.

We will send an email update as soon as the new date is officially confirmed. Thank you so much for your patience, love, and understanding!`

const DEFAULT_CANCELLED_TEMPLATE = `We are sad to share that our upcoming run has been **cancelled**. We know how much everyone was looking forward to running together, and we sincerely apologize for any disappointment caused.

Please click the button below to fill up the refund request form so our team can process your full refund immediately.

Thank you so much for your love, support, and understanding! We will be back with another run soon.`

export function CancelEventSidebarAction() {
  const { id } = useDocumentInfo()
  const [mounted, setMounted] = useState(false)
  const [isCancelled, setIsCancelled] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [noticeType, setNoticeType] = useState<'cancelled' | 'postponed'>('cancelled')

  const [customMessage, setCustomMessage] = useState(DEFAULT_CANCELLED_TEMPLATE)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [savedPostponedMsg, setSavedPostponedMsg] = useState<string | null>(null)
  const [savedCancelledMsg, setSavedCancelledMsg] = useState<string | null>(null)

  const handleNoticeTypeChange = (type: 'cancelled' | 'postponed') => {
    setNoticeType(type)
    if (type === 'postponed') {
      setCustomMessage(savedPostponedMsg || DEFAULT_POSTPONED_TEMPLATE)
    } else {
      setCustomMessage(savedCancelledMsg || DEFAULT_CANCELLED_TEMPLATE)
    }
  }


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!id) return
    let active = true

    async function checkEventStatus() {
      try {
        const res = await fetch(`/api/events/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (active && data) {
            setIsCancelled(Boolean(data.isCancelled))
            if (data.noticeMessagePostponed) {
              setSavedPostponedMsg(data.noticeMessagePostponed)
            }
            if (data.noticeMessageCancelled) {
              setSavedCancelledMsg(data.noticeMessageCancelled)
              setCustomMessage(data.noticeMessageCancelled)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching event cancellation status:', err)
      }
    }

    checkEventStatus()
    return () => {
      active = false
    }
  }, [id])


  if (!mounted || !id) return null

  const handleCancelEvent = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cancel-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          noticeType,
          customMessage: customMessage.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update event')
      }

      setIsCancelled(true)
      setShowModal(false)
      toast.success(data.message || 'Notification emails sent to attendees!')
    } catch (err: any) {
      console.error('Error updating event:', err)
      toast.error(err.message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--theme-elevation-200, #e2e8f0)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500, #64748b)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <AlertTriangle size={13} style={{ color: isCancelled ? '#eab308' : '#dc2626' }} />
        Event Status & Cancellation / Postponement
      </div>

      {isCancelled ? (
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#ca8a04', marginBottom: '4px' }}>
            📢 Event Cancelled / Postponed
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--theme-elevation-600, #475569)',
              margin: '0 0 10px 0',
            }}
          >
            This event notice was broadcast. Attendees have been sent refund request links.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--theme-elevation-300, #cbd5e1)',
              backgroundColor: 'var(--theme-elevation-100, #ffffff)',
              color: 'var(--theme-elevation-800, #1e293b)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Send size={12} />
            Resend Notice Emails
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.05)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: 'var(--theme-elevation-600, #475569)',
              margin: '0 0 10px 0',
            }}
          >
            Need to cancel or postpone this event? Send custom notice emails with refund links.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
            }}
          >
            <AlertTriangle size={14} />
            Cancel / Postpone Event
          </button>
        </div>
      )}

      {/* Safety Confirmation & Custom Message Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-0, #ffffff)',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--theme-elevation-200, #e2e8f0)',
              color: 'var(--theme-elevation-800, #0f172a)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    backgroundColor: noticeType === 'postponed' ? '#fef3c7' : '#fee2e2',
                    color: noticeType === 'postponed' ? '#d97706' : '#dc2626',
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  Send Event {noticeType === 'postponed' ? 'Postponement' : 'Cancellation'} Notice
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Notice Type Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--theme-elevation-700, #334155)',
                }}
              >
                Notice Type:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleNoticeTypeChange('cancelled')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border:
                      noticeType === 'cancelled'
                        ? '2px solid #dc2626'
                        : '1px solid var(--theme-elevation-300, #cbd5e1)',
                    backgroundColor:
                      noticeType === 'cancelled' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                    color:
                      noticeType === 'cancelled'
                        ? '#dc2626'
                        : 'var(--theme-elevation-700, #475569)',
                  }}
                >
                  Cancelled
                </button>
                <button
                  type="button"
                  onClick={() => handleNoticeTypeChange('postponed')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border:
                      noticeType === 'postponed'
                        ? '2px solid #d97706'
                        : '1px solid var(--theme-elevation-300, #cbd5e1)',
                    backgroundColor:
                      noticeType === 'postponed' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                    color:
                      noticeType === 'postponed'
                        ? '#d97706'
                        : 'var(--theme-elevation-700, #475569)',
                  }}
                >
                  Postponed
                </button>
              </div>
            </div>

            {/* Tab Selector: Edit vs Preview */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--theme-elevation-200, #cbd5e1)',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom:
                    activeTab === 'edit' ? '2px solid #E93998' : '2px solid transparent',
                  color: activeTab === 'edit' ? '#E93998' : 'var(--theme-elevation-600, #64748b)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Compose Message
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom:
                    activeTab === 'preview' ? '2px solid #E93998' : '2px solid transparent',
                  color:
                    activeTab === 'preview' ? '#E93998' : 'var(--theme-elevation-600, #64748b)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Live Email Preview
              </button>
            </div>

            {/* TAB 1: EDIT MESSAGE */}
            {activeTab === 'edit' && (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--theme-elevation-700, #334155)',
                    }}
                  >
                    Main Email Message (Sent to attendees):
                  </label>
                  <button
                    type="button"
                    onClick={() => handleNoticeTypeChange(noticeType)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#E93998',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Reset to Default Template
                  </button>
                </div>

                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={
                    noticeType === 'postponed'
                      ? 'e.g. Due to venue maintenance, our event has been postponed.\n\nKey updates:\n- New date will be announced next week.\n- Tickets remain valid.\n- Full refunds available if you cannot make it.'
                      : 'e.g. Due to severe weather warnings, we regret to inform you that this event is cancelled.\n\nPlease click below to request your 100% refund.'
                  }
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-elevation-250, #cbd5e1)',
                    backgroundColor: 'var(--theme-elevation-0, #ffffff)',
                    color: 'var(--theme-elevation-900, #0f172a)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
                {/* Formatting Helper Guide Box */}
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--theme-elevation-100, #f8fafc)',
                    border: '1px solid var(--theme-elevation-200, #e2e8f0)',
                    fontSize: '11px',
                    color: 'var(--theme-elevation-700, #334155)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: 'var(--theme-elevation-900, #0f172a)',
                    }}
                  >
                    Formatting Options Guide:
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px 12px',
                      lineHeight: 1.5,
                    }}
                  >
                    <div>
                      <strong>Bold:</strong> <code>**text**</code>
                    </div>
                    <div>
                      <strong>Italic:</strong> <code>*text*</code>
                    </div>
                    <div>
                      <strong>Bullet List:</strong> <code>- Item 1</code>
                    </div>
                    <div>
                      <strong>Hyperlink:</strong> <code>[Text](url)</code>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      color: 'var(--theme-elevation-500, #64748b)',
                      fontSize: '10.5px',
                      borderTop: '1px border-dash var(--theme-elevation-200, #e2e8f0)',
                      paddingTop: '4px',
                    }}
                  >
                    Press Enter twice to create separate paragraphs.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE EMAIL PREVIEW */}
            {activeTab === 'preview' && (
              <div
                style={{
                  marginBottom: '20px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontSize: '13px',
                }}
              >
                {/* Email Header */}
                <div
                  style={{
                    background:
                      noticeType === 'postponed'
                        ? 'linear-gradient(135deg,#eab308 0%,#f59e0b 100%)'
                        : 'linear-gradient(135deg,#dc2626 0%,#f43f5e 100%)',

                    padding: '24px',
                    textAlign: 'center',
                    color: '#ffffff',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      opacity: 0.9,
                    }}
                  >
                    oneseventycadence
                  </p>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>
                    {noticeType === 'postponed' ? 'Event Postponed' : 'Event Cancelled'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.95 }}>
                    {noticeType === 'postponed'
                      ? 'Important update regarding event'
                      : 'Cancellation notice for event'}
                  </p>
                </div>

                {/* Email Body Preview */}
                <div style={{ padding: '24px' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
                    Hi <strong>[Participant Name]</strong>,
                  </p>

                  <div
                    style={{ marginBottom: '24px' }}
                    dangerouslySetInnerHTML={{
                      __html:
                        customMessage && customMessage.trim()
                          ? renderMarkdownPreview(customMessage)
                          : noticeType === 'postponed'
                            ? '<p style="margin:0 0 14px 0; color:#374151; line-height:1.6;">We regret to inform you that this event has been postponed. We are working on confirming the new date and will update you shortly.</p>'
                            : '<p style="margin:0 0 14px 0; color:#374151; line-height:1.6;">We deeply regret to inform you that this event has been cancelled. We sincerely apologize for any inconvenience caused.</p>',
                    }}
                  />

                  {/* Sample CTA Box */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: '#64748b',
                      }}
                    >
                      {noticeType === 'postponed' ? 'Refund Options' : 'Full Refund Information'}
                    </p>
                    <h4
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      Refund Amount: RM XX.XX
                    </h4>
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg,#E93998 0%,#ff73b9 100%)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: '10px 20px',
                        borderRadius: '6px',
                      }}
                    >
                      {noticeType === 'postponed' ? 'Request Refund →' : 'Submit Refund Details →'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--theme-elevation-300, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-elevation-800, #334155)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleCancelEvent}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: noticeType === 'postponed' ? '#d97706' : '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {loading
                  ? 'Sending Emails...'
                  : `Send ${noticeType === 'postponed' ? 'Postponement' : 'Cancellation'} Notice`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
