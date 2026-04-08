import React, { memo } from 'react'
import { SEAT_STATUS } from '../utils/seatHelpers'

// Pre-computed style maps — no object allocation per render
const SEAT_STYLES = {
  [SEAT_STATUS.AVAILABLE]: {
    base: 'bg-emerald-900/30 border-emerald-600/25 text-emerald-300/80 cursor-pointer',
    hover: 'hover:bg-emerald-500/25 hover:border-emerald-400/60 hover:text-emerald-200',
    shadow: '',
    disabled: false,
  },
  [SEAT_STATUS.SELECTED]: {
    base: 'bg-amber-500/25 border-amber-400/70 text-amber-100 cursor-pointer',
    hover: 'hover:bg-amber-400/35 hover:border-amber-300',
    shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.35)]',
    disabled: false,
  },
  [SEAT_STATUS.SOLD]: {
    base: 'bg-red-950/50 border-red-800/30 text-red-800/60 cursor-not-allowed',
    hover: '',
    shadow: '',
    disabled: true,
  },
  [SEAT_STATUS.PENDING]: {
    base: 'bg-blue-700/20 border-blue-500/50 text-blue-300 cursor-wait',
    hover: '',
    shadow: 'shadow-[0_0_10px_rgba(91,143,255,0.3)]',
    disabled: true,
  },
}

const Seat = memo(({ seatId, status, onClick }) => {
  const styles = SEAT_STYLES[status] ?? SEAT_STYLES[SEAT_STATUS.AVAILABLE]

  return (
    <button
      type="button"
      onClick={() => !styles.disabled && onClick(seatId)}
      disabled={styles.disabled}
      title={`Seat ${seatId} · ${status}`}
      aria-label={`Seat ${seatId}, ${status}`}
      className={[
        'seat-btn relative w-9 h-9 rounded-md text-[10px] font-mono',
        'border select-none flex items-center justify-center',
        'transition-all duration-150',
        styles.base,
        styles.hover,
        styles.shadow,
      ].join(' ')}
    >
      {/* SOLD — diagonal cross */}
      {status === SEAT_STATUS.SOLD && (
        <svg
          className="absolute inset-0 w-full h-full p-2 opacity-40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )}

      {/* PENDING — spinner, no label */}
      {status === SEAT_STATUS.PENDING && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="w-3.5 h-3.5 rounded-full border border-blue-400/80 border-t-transparent animate-spin" />
        </span>
      )}

      {/* Label — hidden while pending to avoid overlap with spinner */}
      {status !== SEAT_STATUS.PENDING && (
        <span className="leading-none pointer-events-none">{seatId}</span>
      )}

      {/* SELECTED — amber dot */}
      {status === SEAT_STATUS.SELECTED && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-void"
          aria-hidden="true"
        />
      )}
    </button>
  )
})

Seat.displayName = 'Seat'
export default Seat
