import React from 'react'
import { formatSeatList } from '../utils/seatHelpers'

const STATUS_CONFIG = {
  idle:    { label: 'Ready',       dot: '#374151',  text: 'text-muted'   },
  loading: { label: 'Processing',  dot: '#5b8fff',  text: 'text-pending' },
  success: { label: 'Submitted',   dot: '#00ff88',  text: 'text-success' },
  partial: { label: 'Partial',     dot: '#ffb800',  text: 'text-warning' },
  failed:  { label: 'Failed',      dot: '#ff3b6b',  text: 'text-danger'  },
}

const Row = ({ label, value, valueClass = 'text-dim' }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
    <span className="text-[10px] font-mono text-muted/60 uppercase tracking-widest flex-shrink-0 mt-0.5">
      {label}
    </span>
    <span className={`text-xs font-mono text-right break-all leading-relaxed ${valueClass}`}>
      {value}
    </span>
  </div>
)

const BookingPanel = ({
  selectedSeats,
  bookingStatus,
  waitlistData,
  onConfirmBooking,
  onClearSelection,
  loading,
}) => {
  const cfg = STATUS_CONFIG[bookingStatus] ?? STATUS_CONFIG.idle
  const hasSeats = selectedSeats.length > 0
  const canBook = hasSeats && !loading

  return (
    <aside
      className="rounded-2xl p-5 flex flex-col gap-4 h-fit sticky top-20"
      style={{
        background: 'rgba(13,17,23,0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-600 text-sm text-white tracking-tight">
          Booking Panel
        </h2>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: cfg.dot,
              boxShadow: bookingStatus !== 'idle' ? `0 0 6px ${cfg.dot}` : 'none',
              transition: 'background-color 0.3s',
            }}
          />
          <span className={`text-[11px] font-mono ${cfg.text}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Selected seats */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono text-muted/60 uppercase tracking-widest">
            Selected
          </span>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded-full tabular-nums"
            style={{
              background: hasSeats ? 'rgba(0,217,255,0.12)' : 'rgba(255,255,255,0.04)',
              color: hasSeats ? '#00d9ff' : '#4b5563',
              border: `1px solid ${hasSeats ? 'rgba(0,217,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.2s',
            }}
          >
            {selectedSeats.length}
          </span>
        </div>

        {hasSeats ? (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {selectedSeats.map((seatId) => (
              <span
                key={seatId}
                className="px-2 py-1 rounded-md text-[11px] font-mono text-amber-200"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.28)',
                }}
              >
                {seatId}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted/40 italic font-mono">
            Click seats on the map…
          </p>
        )}
      </div>

      {/* Booking result */}
      {waitlistData && (
        <div
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[10px] font-mono text-muted/60 uppercase tracking-widest mb-1">
            Last Result
          </p>
          {waitlistData.waitlistId && (
            <Row label="Waitlist" value={waitlistData.waitlistId} valueClass="text-accent" />
          )}
          {waitlistData.requestedSeats?.length > 0 && (
            <Row label="Requested" value={formatSeatList(waitlistData.requestedSeats)} valueClass="text-white/80" />
          )}
          {waitlistData.acceptedSeats?.length > 0 && (
            <Row label="Accepted" value={formatSeatList(waitlistData.acceptedSeats)} valueClass="text-success" />
          )}
          {waitlistData.failedSeats?.length > 0 && (
            <Row label="Failed" value={formatSeatList(waitlistData.failedSeats)} valueClass="text-danger" />
          )}
          {waitlistData.failedSeat && (
            <Row label="Locked by" value={waitlistData.failedSeat} valueClass="text-danger" />
          )}
          {waitlistData.message && !waitlistData.success && (
            <div
              className="mt-2 p-2.5 rounded-lg text-[11px] font-mono leading-relaxed text-danger/90"
              style={{ background: 'rgba(255,59,107,0.07)', border: '1px solid rgba(255,59,107,0.18)' }}
            >
              {waitlistData.message}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirmBooking}
          disabled={!canBook}
          className="w-full py-3.5 rounded-xl font-display font-600 text-sm tracking-wide transition-all duration-200 relative overflow-hidden"
          style={
            canBook
              ? {
                  background: 'linear-gradient(135deg, #00d9ff 0%, #5b8fff 100%)',
                  color: '#070910',
                  boxShadow: '0 4px 20px rgba(0,217,255,0.25)',
                  cursor: 'pointer',
                }
              : {
                  background: 'rgba(255,255,255,0.04)',
                  color: '#374151',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: loading ? 'wait' : 'not-allowed',
                }
          }
          onMouseEnter={(e) => {
            if (canBook) {
              e.currentTarget.style.transform = 'scale(1.015)'
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,217,255,0.35)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = canBook ? '0 4px 20px rgba(0,217,255,0.25)' : 'none'
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"/>
              </svg>
              Processing…
            </span>
          ) : (
            `Confirm Booking${hasSeats ? ` · ${selectedSeats.length}` : ''}`
          )}
        </button>

        {hasSeats && !loading && (
          <button
            type="button"
            onClick={onClearSelection}
            className="w-full py-2 rounded-xl text-[11px] font-mono text-muted/50 hover:text-muted transition-colors duration-150"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Context footer */}
      <div className="pt-3 border-t border-white/[0.04]">
        <Row label="User" value="u123" />
        <Row label="Event" value="e456" />
      </div>
    </aside>
  )
}

export default BookingPanel
