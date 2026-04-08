import React, { useState, useEffect, useRef } from 'react'

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(value)
  const [flash, setFlash] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === prevRef.current) return
    prevRef.current = value
    setFlash(true)
    const duration = 400
    const start = display
    const diff = value - start
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    setTimeout(() => setFlash(false), 600)
  }, [value])

  return (
    <span
      className="font-display font-700 text-3xl transition-colors duration-300"
      style={{ color: flash ? '#00d9ff' : '#ffffff' }}
    >
      {display.toLocaleString()}
    </span>
  )
}

const STAT_DEFS = [
  {
    key: 'activeRequests',
    label: 'Active Requests',
    sublabel: 'in-flight',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="#5b8fff" strokeWidth="1.5"/>
        <path d="M9 5v4l2.5 2.5" stroke="#5b8fff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#5b8fff',
    bg: 'rgba(91,143,255,0.08)',
    border: 'rgba(91,143,255,0.2)',
  },
  {
    key: 'queueDepth',
    label: 'Queue Depth',
    sublabel: 'pending jobs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="2.5" rx="1.25" fill="#ffb800" opacity="0.9"/>
        <rect x="2" y="8" width="10" height="2.5" rx="1.25" fill="#ffb800" opacity="0.6"/>
        <rect x="2" y="12" width="6"  height="2.5" rx="1.25" fill="#ffb800" opacity="0.3"/>
      </svg>
    ),
    color: '#ffb800',
    bg: 'rgba(255,184,0,0.08)',
    border: 'rgba(255,184,0,0.2)',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    sublabel: 'tickets sold',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 9.5L7 13.5L15 5" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#00ff88',
    bg: 'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.2)',
  },
  {
    key: 'failed',
    label: 'Failed',
    sublabel: 'this session',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M5 5L13 13M13 5L5 13" stroke="#ff3b6b" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#ff3b6b',
    bg: 'rgba(255,59,107,0.08)',
    border: 'rgba(255,59,107,0.2)',
  },
]

const LiveStats = ({ stats }) => {
  // Animate simulated fluctuation for demo realism
  const [simStats, setSimStats] = useState({
    activeRequests: stats.activeRequests ?? 0,
    queueDepth: stats.queueDepth ?? 0,
    confirmed: stats.confirmed ?? 0,
    failed: stats.failed ?? 0,
  })

  // Sync real stats from parent
  useEffect(() => {
    setSimStats((prev) => ({
      activeRequests: stats.activeRequests ?? prev.activeRequests,
      queueDepth: stats.queueDepth ?? prev.queueDepth,
      confirmed: stats.confirmed ?? prev.confirmed,
      failed: stats.failed ?? prev.failed,
    }))
  }, [stats.confirmed, stats.failed])

  // Simulate fluctuating activeRequests and queueDepth for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setSimStats((prev) => ({
        ...prev,
        activeRequests: Math.max(0, prev.activeRequests + Math.floor(Math.random() * 7) - 2),
        queueDepth: Math.max(0, prev.queueDepth + Math.floor(Math.random() * 5) - 1),
      }))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Seed initial non-zero values for demo
  useEffect(() => {
    setSimStats((prev) => ({
      ...prev,
      activeRequests: prev.activeRequests || 12,
      queueDepth: prev.queueDepth || 7,
    }))
  }, [])

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STAT_DEFS.map((def) => (
        <div
          key={def.key}
          className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
          style={{
            background: def.bg,
            border: `1px solid ${def.border}`,
          }}
        >
          {/* Background glow blob */}
          <div
            className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 blur-xl pointer-events-none"
            style={{ background: def.color }}
          />

          {/* Icon + label */}
          <div className="flex items-center justify-between">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${def.color}18`, border: `1px solid ${def.color}30` }}
            >
              {def.icon}
            </div>
            {/* Micro sparkline placeholder */}
            <div className="flex items-end gap-0.5 h-5">
              {[3,5,4,7,5,8,6,9].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-sm transition-all duration-700"
                  style={{
                    height: `${h * 2.2}px`,
                    background: def.color,
                    opacity: 0.15 + (i / 8) * 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <AnimatedNumber value={simStats[def.key]} />
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xs font-body" style={{ color: def.color }}>
                {def.label}
              </span>
            </div>
            <span className="text-xs font-mono text-muted/60">{def.sublabel}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

export default LiveStats
