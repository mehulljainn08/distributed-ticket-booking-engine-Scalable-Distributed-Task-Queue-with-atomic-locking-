import React, { useMemo, useCallback } from 'react'
import Seat from './Seat'
import { ROWS, COLS, getSeatStyle, SEAT_STATUS } from '../utils/seatHelpers'

const LEGEND = [
  { status: SEAT_STATUS.AVAILABLE, label: 'Available', color: 'rgba(16,185,129,0.4)',  border: 'rgba(52,211,153,0.4)'  },
  { status: SEAT_STATUS.SELECTED,  label: 'Selected',  color: 'rgba(245,158,11,0.35)', border: 'rgba(251,191,36,0.5)'  },
  { status: SEAT_STATUS.PENDING,   label: 'Pending',   color: 'rgba(59,130,246,0.3)',  border: 'rgba(99,179,237,0.5)'  },
  { status: SEAT_STATUS.SOLD,      label: 'Sold',      color: 'rgba(127,29,29,0.5)',   border: 'rgba(185,28,28,0.3)'   },
]

const SeatGrid = ({ selectedSeats, soldSeats, pendingSeats, onSeatClick }) => {
  const grid = useMemo(
    () => ROWS.map((row) => ({ row, seats: COLS.map((col) => `${row}${col}`) })),
    []
  )

  const totalSeats = ROWS.length * COLS.length
  const soldCount = soldSeats.size
  const availableCount = totalSeats - soldCount
  const pct = Math.round((soldCount / totalSeats) * 100)

  const getStatus = useCallback(
    (seatId) => getSeatStyle(seatId, selectedSeats, soldSeats, pendingSeats),
    [selectedSeats, soldSeats, pendingSeats]
  )

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
      {/* Stage */}
      <div className="relative flex flex-col items-center gap-1">
        <div
          className="w-3/4 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(90deg, rgba(0,217,255,0.04), rgba(0,217,255,0.14) 50%, rgba(0,217,255,0.04))',
            border: '1px solid rgba(0,217,255,0.18)',
            boxShadow: '0 8px 32px rgba(0,217,255,0.06)',
          }}
        >
          <span className="text-[11px] font-mono text-accent/70 tracking-[0.25em] uppercase">
            Stage / Screen
          </span>
        </div>
        {/* Perspective arc lines */}
        <div className="flex flex-col items-center gap-0.5 opacity-[0.07]">
          {[95, 88, 80].map((w, i) => (
            <div
              key={i}
              className="rounded-b-full"
              style={{
                width: `${w}%`,
                height: '6px',
                border: '1px solid rgba(0,217,255,0.8)',
                borderTop: 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col items-center gap-2 overflow-x-auto pb-1">
        {grid.map(({ row, seats }) => (
          <div key={row} className="flex items-center gap-2 flex-shrink-0">
            {/* Row label left */}
            <span className="w-5 text-[10px] font-mono text-muted/50 text-right flex-shrink-0">
              {row}
            </span>

            {/* Left block */}
            <div className="flex gap-1.5">
              {seats.slice(0, 4).map((seatId) => (
                <Seat
                  key={seatId}
                  seatId={seatId}
                  status={getStatus(seatId)}
                  onClick={onSeatClick}
                />
              ))}
            </div>

            {/* Aisle */}
            <div className="w-5 flex-shrink-0 flex items-center justify-center">
              <div className="h-full w-px bg-border/30" />
            </div>

            {/* Right block */}
            <div className="flex gap-1.5">
              {seats.slice(4, 8).map((seatId) => (
                <Seat
                  key={seatId}
                  seatId={seatId}
                  status={getStatus(seatId)}
                  onClick={onSeatClick}
                />
              ))}
            </div>

            {/* Row label right */}
            <span className="w-5 text-[10px] font-mono text-muted/50 flex-shrink-0">
              {row}
            </span>
          </div>
        ))}

        {/* Column numbers */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-5" />
          <div className="flex gap-1.5">
            {COLS.slice(0, 4).map((c) => (
              <div key={c} className="w-9 text-center text-[10px] font-mono text-muted/30">{c}</div>
            ))}
          </div>
          <div className="w-5" />
          <div className="flex gap-1.5">
            {COLS.slice(4, 8).map((c) => (
              <div key={c} className="w-9 text-center text-[10px] font-mono text-muted/30">{c}</div>
            ))}
          </div>
          <div className="w-5" />
        </div>
      </div>

      {/* Footer: legend + fill bar */}
      <div className="flex flex-col gap-3 pt-3 border-t border-border/40">
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGEND.map(({ status, label, color, border }) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-3.5 rounded"
                style={{ background: color, border: `1px solid ${border}` }}
              />
              <span className="text-[11px] font-body text-dim/80">{label}</span>
            </div>
          ))}
        </div>

        {/* Capacity bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct > 75
                  ? 'linear-gradient(90deg, #ff3b6b, #ff6b6b)'
                  : pct > 40
                  ? 'linear-gradient(90deg, #ffb800, #ffcc44)'
                  : 'linear-gradient(90deg, #00d9ff, #5b8fff)',
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-muted/60 flex-shrink-0">
            <span className="text-white/80">{availableCount}</span>/{totalSeats} free
          </span>
        </div>
      </div>
    </div>
  )
}

export default SeatGrid
