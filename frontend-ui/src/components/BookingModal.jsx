import React, { useEffect } from 'react'
import { formatSeatList } from '../utils/seatHelpers'

const BookingModal = ({ isOpen, onClose, data }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const isSuccess = data.success
  const hasPartial = isSuccess && data.failedSeats?.length > 0

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,9,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="modal-content w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'linear-gradient(145deg, #111827, #0d1117)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isSuccess
            ? '0 0 60px rgba(0,217,255,0.1), 0 24px 48px rgba(0,0,0,0.6)'
            : '0 0 60px rgba(255,59,107,0.1), 0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Icon */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isSuccess
                ? 'linear-gradient(135deg, rgba(0,217,255,0.2), rgba(0,255,136,0.1))'
                : 'rgba(255,59,107,0.15)',
              border: `1px solid ${isSuccess ? 'rgba(0,217,255,0.3)' : 'rgba(255,59,107,0.3)'}`,
            }}
          >
            {isSuccess ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#00d9ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5M12 16h.01" stroke="#ff3b6b" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="#ff3b6b" strokeWidth="2"/>
              </svg>
            )}
          </div>
          <div>
            <h2 className="font-display font-700 text-white text-lg">
              {isSuccess
                ? hasPartial ? 'Partial Booking' : 'Booking Submitted'
                : 'Booking Failed'}
            </h2>
            <p className="text-xs font-mono text-muted mt-0.5">
              {isSuccess ? 'Your request is in the queue' : 'Could not process your request'}
            </p>
          </div>
        </div>

        {/* Data */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {isSuccess && data.waitlistId && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted uppercase tracking-widest">Waitlist ID</span>
              <span
                className="text-sm font-mono px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,217,255,0.1)', color: '#00d9ff', border: '1px solid rgba(0,217,255,0.2)' }}
              >
                {data.waitlistId}
              </span>
            </div>
          )}

          {data.requestedSeats?.length > 0 && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-mono text-muted uppercase tracking-widest flex-shrink-0">Requested</span>
              <span className="text-sm font-mono text-white text-right">{formatSeatList(data.requestedSeats)}</span>
            </div>
          )}

          {data.acceptedSeats?.length > 0 && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-mono text-muted uppercase tracking-widest flex-shrink-0">Accepted</span>
              <span className="text-sm font-mono text-success text-right">{formatSeatList(data.acceptedSeats)}</span>
            </div>
          )}

          {data.failedSeats?.length > 0 && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-mono text-muted uppercase tracking-widest flex-shrink-0">Failed</span>
              <span className="text-sm font-mono text-danger text-right">{formatSeatList(data.failedSeats)}</span>
            </div>
          )}

          {data.failedSeat && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted uppercase tracking-widest">Failed Seat</span>
              <span className="text-sm font-mono text-danger">{data.failedSeat}</span>
            </div>
          )}

          {data.message && (
            <div className="mt-1 p-3 rounded-lg bg-red-950/40 border border-red-900/40">
              <p className="text-sm text-danger font-mono leading-relaxed">{data.message}</p>
            </div>
          )}
        </div>

        {/* Partial success explanation */}
        {hasPartial && (
          <div
            className="p-3 rounded-xl flex gap-3"
            style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
          >
            <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#ffb800" strokeWidth="1.5"/>
              <path d="M7 4.5v3.5M7 9.5h.01" stroke="#ffb800" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-warning/80 leading-relaxed">
              Some seats could not be locked. Accepted seats are queued for payment. Failed seats are released.
            </p>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-display font-600 text-sm text-dim hover:text-white transition-colors duration-200"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default BookingModal
