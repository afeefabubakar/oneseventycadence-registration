'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo, toast } from '@payloadcms/ui'
import {
  AlertTriangle,
  Send,
  X,
  RefreshCw,
  AlertCircle,
  Save,
  RotateCcw,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { parseSimpleMarkdownToHtml } from '@/lib/emails/utils'
import {
  DEFAULT_POSTPONED_TEMPLATE,
  DEFAULT_CANCELLED_TEMPLATE,
  DEFAULT_REOPENED_TEMPLATE,
  DEFAULT_REOPEN_INVITE_TEMPLATE,
} from '@/lib/emails/templates'

export function CancelEventSidebarAction() {
  const { id } = useDocumentInfo()
  const [mounted, setMounted] = useState(false)
  const [isCancelled, setIsCancelled] = useState<boolean>(false)
  const [isPostponed, setIsPostponed] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Reopen state
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [savingReopenDraft, setSavingReopenDraft] = useState(false)
  const [reopenMessage, setReopenMessage] = useState<string>('')
  const [reopenTab, setReopenTab] = useState<'edit' | 'preview'>('edit')
  const [savedReopenedMsg, setSavedReopenedMsg] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [notifyRefunded, setNotifyRefunded] = useState<boolean>(true)
  const [previewRecipient, setPreviewRecipient] = useState<'active' | 'refunded'>('active')

  const [noticeType, setNoticeType] = useState<'cancelled' | 'postponed'>('cancelled')

  const [customMessage, setCustomMessage] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [savedPostponedMsg, setSavedPostponedMsg] = useState<string | null>(null)
  const [savedCancelledMsg, setSavedCancelledMsg] = useState<string | null>(null)

  const handleNoticeTypeChange = (type: 'cancelled' | 'postponed') => {
    setNoticeType(type)
    if (type === 'postponed') {
      setCustomMessage(savedPostponedMsg || '')
    } else {
      setCustomMessage(savedCancelledMsg || '')
    }
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      const res = await fetch('/api/cancel-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          noticeType,
          customMessage: customMessage.trim() || undefined,
          saveOnly: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save template draft')
      }

      if (noticeType === 'postponed') {
        setSavedPostponedMsg(customMessage)
      } else {
        setSavedCancelledMsg(customMessage)
      }

      toast.success(data.message || 'Template draft saved to event!')
    } catch (err: any) {
      console.error('Error saving template draft:', err)
      toast.error(err.message || 'Failed to save template draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSaveReopenDraft = async () => {
    setSavingReopenDraft(true)
    try {
      const res = await fetch('/api/reopen-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          customMessage: reopenMessage.trim() || undefined,
          saveOnly: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save reopen draft')
      }

      setSavedReopenedMsg(reopenMessage)
      toast.success(data.message || 'Reopen template draft saved to event!')
    } catch (err: any) {
      console.error('Error saving reopen draft:', err)
      toast.error(err.message || 'Failed to save draft')
    } finally {
      setSavingReopenDraft(false)
    }
  }

  const handleReopenEvent = async () => {
    setReopening(true)
    try {
      const activeReopenMsg = reopenMessage.trim() || savedReopenedMsg || undefined
      const res = await fetch('/api/reopen-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          customMessage: activeReopenMsg,
          notifyRefunded,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reopen event')
      }

      setIsPostponed(false)
      setIsCancelled(false)
      setShowReopenModal(false)
      toast.success(data.message || 'Event reopened and notification emails sent!')

      // Reload page to reflect active status in Payload CMS form
      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch (err: any) {
      console.error('Error reopening event:', err)
      toast.error(err.message || 'Failed to reopen event')
    } finally {
      setReopening(false)
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
            setEventDetails(data)
            setIsCancelled(Boolean(data.isCancelled))
            setIsPostponed(Boolean(data.isPostponed))
            if (data.noticeMessagePostponed) {
              setSavedPostponedMsg(data.noticeMessagePostponed)
            }
            if (data.noticeMessageCancelled) {
              setSavedCancelledMsg(data.noticeMessageCancelled)
            }
            if (data.noticeMessageReopened) {
              setSavedReopenedMsg(data.noticeMessageReopened)
            }

            // Only prefill textarea if a saved draft exists
            const initialNoticeMsg =
              noticeType === 'postponed' ? data.noticeMessagePostponed : data.noticeMessageCancelled
            if (initialNoticeMsg) {
              setCustomMessage(initialNoticeMsg)
            } else {
              setCustomMessage('')
            }

            if (data.noticeMessageReopened) {
              setReopenMessage(data.noticeMessageReopened)
            } else {
              setReopenMessage('')
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
      const activeMsg =
        customMessage.trim() ||
        (noticeType === 'postponed' ? savedPostponedMsg : savedCancelledMsg) ||
        undefined
      const res = await fetch('/api/cancel-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          noticeType,
          customMessage: activeMsg,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update event')
      }

      if (noticeType === 'postponed') {
        setIsPostponed(true)
        setIsCancelled(false)
      } else {
        setIsCancelled(true)
        setIsPostponed(false)
      }
      setShowModal(false)
      toast.success(data.message || 'Notification emails sent to attendees!')
    } catch (err: any) {
      console.error('Error updating event:', err)
      toast.error(err.message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const formattedEventDate = eventDetails?.date
    ? new Date(eventDetails.date).toLocaleDateString('en-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kuala_Lumpur',
      })
    : 'TBA'

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
        <AlertTriangle
          size={13}
          style={{ color: isPostponed ? '#eab308' : isCancelled ? '#dc2626' : '#64748b' }}
        />
        Event Status & Notice Broadcast
      </div>

      {isPostponed ? (
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#ca8a04', marginBottom: '4px' }}>
            📢 Event Postponed
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--theme-elevation-600, #475569)',
              margin: '0 0 12px 0',
            }}
          >
            This event is postponed. You can reopen it with updated details & notify participants,
            or resend notice emails.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowReopenModal(true)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
              }}
            >
              <RotateCcw size={14} />
              Reopen Event & Notify Participants
            </button>

            <button
              type="button"
              onClick={() => {
                setNoticeType('postponed')
                setCustomMessage(savedPostponedMsg || DEFAULT_POSTPONED_TEMPLATE)
                setShowModal(true)
              }}
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
              Resend Postponement Notice
            </button>
          </div>
        </div>
      ) : isCancelled ? (
        <div
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#dc2626', marginBottom: '4px' }}>
            📢 Event Cancelled
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
            onClick={() => {
              setNoticeType('cancelled')
              setCustomMessage(savedCancelledMsg || DEFAULT_CANCELLED_TEMPLATE)
              setShowModal(true)
            }}
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
            Resend Cancellation Notice
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

      {/* Safety Confirmation & Custom Message Modal (Cancel / Postpone) */}
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
                    onClick={() => setCustomMessage('')}
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
                    Clear / Reset Textarea
                  </button>
                </div>

                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={
                    noticeType === 'postponed'
                      ? savedPostponedMsg || DEFAULT_POSTPONED_TEMPLATE
                      : savedCancelledMsg || DEFAULT_CANCELLED_TEMPLATE
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
                    background: 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)',
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
                      ? `Important update regarding ${eventDetails?.name || 'Event'}`
                      : `Cancellation notice for ${eventDetails?.name || 'Event'}`}
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
                      __html: parseSimpleMarkdownToHtml(
                        customMessage.trim() ||
                          (noticeType === 'postponed'
                            ? savedPostponedMsg || DEFAULT_POSTPONED_TEMPLATE
                            : savedCancelledMsg || DEFAULT_CANCELLED_TEMPLATE),
                      ),
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
                disabled={loading || savingDraft}
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
                onClick={handleSaveDraft}
                disabled={loading || savingDraft}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--theme-elevation-300, #cbd5e1)',
                  backgroundColor: 'var(--theme-elevation-100, #ffffff)',
                  color: 'var(--theme-elevation-800, #1e293b)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: savingDraft ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {savingDraft ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleCancelEvent}
                disabled={loading || savingDraft}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: noticeType === 'postponed' ? '#d97706' : '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading || savingDraft ? 'not-allowed' : 'pointer',
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

      {/* REOPEN EVENT MODAL */}
      {showReopenModal && (
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
              maxWidth: '540px',
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
                    backgroundColor: '#d1fae5',
                    color: '#059669',
                  }}
                >
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                    Reopen Event & Notify Participants 🎉
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Reopen registration and broadcast updated details to participants.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                disabled={reopening}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Event Info Box */}
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                fontSize: '12px',
                color: '#065f46',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Calendar size={14} />
                Target Event Details:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                <div>
                  <strong>Name:</strong> {eventDetails?.name || 'Current Event'}
                </div>
                <div>
                  <strong>Location:</strong> {eventDetails?.location || 'TBA'}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Saved Date & Time:</strong> {formattedEventDate}
                </div>
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#047857',
                  borderTop: '1px border-dash #a7f3d0',
                  paddingTop: '4px',
                }}
              >
                💡{' '}
                <em>Note: Emails will automatically include the newly saved date and location.</em>
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
                onClick={() => setReopenTab('edit')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom:
                    reopenTab === 'edit' ? '2px solid #10b981' : '2px solid transparent',
                  color: reopenTab === 'edit' ? '#10b981' : 'var(--theme-elevation-600, #64748b)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Compose Announcement
              </button>
              <button
                type="button"
                onClick={() => setReopenTab('preview')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom:
                    reopenTab === 'preview' ? '2px solid #10b981' : '2px solid transparent',
                  color:
                    reopenTab === 'preview' ? '#10b981' : 'var(--theme-elevation-600, #64748b)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Live Email Preview
              </button>
            </div>

            {/* TAB 1: COMPOSE ANNOUNCEMENT */}
            {reopenTab === 'edit' && (
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
                    Reopening Message:
                  </label>
                  <button
                    type="button"
                    onClick={() => setReopenMessage('')}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#10b981',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Reset Textarea
                  </button>
                </div>

                <textarea
                  value={reopenMessage}
                  onChange={(e) => setReopenMessage(e.target.value)}
                  placeholder={savedReopenedMsg || DEFAULT_REOPENED_TEMPLATE}
                  rows={6}
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
                </div>

                {/* Notify Refunded / Cancelled Participants Checkbox */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--theme-elevation-100, #f8fafc)',
                    border: '1px solid var(--theme-elevation-200, #e2e8f0)',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--theme-elevation-800, #1e293b)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifyRefunded}
                      onChange={(e) => setNotifyRefunded(e.target.checked)}
                      style={{
                        width: '15px',
                        height: '15px',
                        accentColor: '#10b981',
                        cursor: 'pointer',
                      }}
                    />
                    <span>
                      Also send re-registration invite email to refunded & cancelled participants
                    </span>
                  </label>
                  <p style={{ margin: '4px 0 0 23px', fontSize: '11px', color: '#64748b' }}>
                    Active participants get a slot confirmation update; refunded participants get a
                    re-registration invitation.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE EMAIL PREVIEW */}
            {reopenTab === 'preview' && (
              <div>
                {notifyRefunded && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewRecipient('active')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border:
                          previewRecipient === 'active'
                            ? '1.5px solid #10b981'
                            : '1px solid var(--theme-elevation-300, #cbd5e1)',
                        backgroundColor: previewRecipient === 'active' ? '#ecfdf5' : 'transparent',
                        color:
                          previewRecipient === 'active'
                            ? '#047857'
                            : 'var(--theme-elevation-700, #475569)',
                      }}
                    >
                      Active Participants
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRecipient('refunded')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border:
                          previewRecipient === 'refunded'
                            ? '1.5px solid #3b82f6'
                            : '1px solid var(--theme-elevation-300, #cbd5e1)',
                        backgroundColor:
                          previewRecipient === 'refunded' ? '#eff6ff' : 'transparent',
                        color:
                          previewRecipient === 'refunded'
                            ? '#1d4ed8'
                            : 'var(--theme-elevation-700, #475569)',
                      }}
                    >
                      Refunded / Cancelled
                    </button>
                  </div>
                )}

                <div
                  style={{
                    marginBottom: '20px',
                    maxHeight: '340px',
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
                      background: 'linear-gradient(135deg, #E93998 0%, #ff73b9 100%)',
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
                      {previewRecipient === 'refunded'
                        ? "We're Back! Re-register Now 🎉"
                        : 'Event Reopened 🎉'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.95 }}>
                      {previewRecipient === 'refunded'
                        ? `New date & details announced for ${eventDetails?.name || 'Event'}`
                        : `Updated event details for ${eventDetails?.name || 'Event'}`}
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
                        __html: parseSimpleMarkdownToHtml(
                          reopenMessage.trim() ||
                            savedReopenedMsg ||
                            (previewRecipient === 'refunded'
                              ? DEFAULT_REOPEN_INVITE_TEMPLATE
                              : DEFAULT_REOPENED_TEMPLATE),
                          '#E93998',
                        ),
                      }}
                    />

                    {/* Updated Event Card Preview */}
                    <div
                      style={{
                        backgroundColor: '#fdf2f8',
                        border: '1px solid #fbcfe8',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 10px 0',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          color: '#be185d',
                        }}
                      >
                        🗓️ Updated Event Details
                      </p>
                      <div style={{ marginBottom: '10px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#9d174d',
                            fontWeight: 600,
                          }}
                        >
                          Event Name:{' '}
                        </span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {eventDetails?.name || 'Event Name'}
                        </span>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#9d174d',
                            fontWeight: 600,
                          }}
                        >
                          New Date & Time:{' '}
                        </span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {formattedEventDate}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#9d174d',
                            fontWeight: 600,
                          }}
                        >
                          Location:{' '}
                        </span>
                        <span style={{ color: '#0f172a' }}>
                          {eventDetails?.location || 'Location'}
                        </span>
                      </div>
                    </div>

                    {previewRecipient === 'refunded' ? (
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        >
                          Want to join us on the new date?
                        </p>
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg,#E93998 0%,#ff73b9 100%)',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 700,
                            padding: '8px 16px',
                            borderRadius: '6px',
                          }}
                        >
                          Re-Register for Event →
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
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
                          Cannot Make It To The New Date?
                        </p>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          Full Refund Option Available
                        </p>
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg,#E93998 0%,#ff73b9 100%)',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 700,
                            padding: '8px 16px',
                            borderRadius: '6px',
                          }}
                        >
                          Request Refund →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                disabled={reopening || savingReopenDraft}
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
                onClick={handleSaveReopenDraft}
                disabled={reopening || savingReopenDraft}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--theme-elevation-300, #cbd5e1)',
                  backgroundColor: 'var(--theme-elevation-100, #ffffff)',
                  color: 'var(--theme-elevation-800, #1e293b)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: savingReopenDraft ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {savingReopenDraft ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {savingReopenDraft ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleReopenEvent}
                disabled={reopening || savingReopenDraft}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: reopening || savingReopenDraft ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {reopening ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                {reopening ? 'Reopening & Sending Emails...' : 'Reopen Event & Send Updates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
