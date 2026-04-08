import React from 'react'

const EVENT_CONFIG = {
  sold: {
    label: 'SOLD',
    color: '#ff3b6b',
    bg: 'rgba(255,59,107,0.08)',
    border: 'rgba(255,59,107,0.2)',
    icon: '✕',
  },
  confirmed: {
    label: 'CONFIRMED',
    color: '#00ff88',
    bg: 'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.2)',
    icon: '✓',
  },
  failed: {
    label: 'FAILED',
    color: '#ff3b6b',
    bg: 'rgba(255,59,107,0.06)',
    border: 'rgba(255,59,107,0.15)',
    icon: '!',
  },
  pending: {
    label: 'PENDING',
    color: '#5b8fff',
    bg: 'rgba(91,143,255,0.08)',
    border: 'rgba(91,143,255,0.2)',
    icon: '▶',
  },
  submitted: {
    label: 'QUEUED',
    color: '#00d9ff',
    bg: 'rgba(0,217,255,0.07)',
    border: 'rgba(0,217,255,0.18)',
    icon: '◈',
  },
}

const ActivityFeed = ({ activities }) => (
  <section className="glass rounded-2xl p-5 flex flex-col gap-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
        <h3 className="font-display font-600 text-sm text-white tracking-tight">
          Live Activity
        </h3>
      </div>
      <span className="text-[11px] font-mono text-muted/60">
        {activities.length === 0 ? 'no events yet' : `last ${activities.length} events`}
      </span>
    </div>

    {/* Event rows */}
    <div className="flex flex-col gap-1.5 min-h-[80px]">
      {activities.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs font-mono text-muted/40 italic">
          Waiting for socket events…
        </div>
      ) : (
        activities.map((item) => {
          const cfg = EVENT_CONFIG[item.type] ?? EVENT_CONFIG.submitted
          return (
            <div
              key={item.id}
              className="animate-ticker flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}
            >
              {/* Type badge */}
              <span
                className="text-[10px] font-mono font-700 w-[72px] flex-shrink-0 tracking-wider"
                style={{ color: cfg.color }}
              >
                {cfg.icon} {cfg.label}
              </span>

              {/* Seat chip */}
              <span
                className="text-[11px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 text-white/80"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                {item.seatId}
              </span>

              {/* Waitlist ID */}
              {item.waitlistId && (
                <span className="text-[11px] font-mono text-muted/50 truncate hidden sm:block">
                  {item.waitlistId}
                </span>
              )}

              {/* Timestamp */}
              <span className="text-[10px] font-mono text-muted/40 ml-auto flex-shrink-0">
                {item.timestamp}
              </span>
            </div>
          )
        })
      )}
    </div>
  </section>
)

export default ActivityFeed
