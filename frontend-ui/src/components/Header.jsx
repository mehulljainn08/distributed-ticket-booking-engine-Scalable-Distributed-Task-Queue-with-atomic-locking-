import React, { useState, useEffect } from 'react'
import { checkHealth } from '../services/api'

const StatusPill = ({ connected, label }) => (
  <div
    className="flex items-center gap-2 rounded-full px-3 py-1.5"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'live-dot' : ''}`}
      style={{
        backgroundColor: connected ? '#00d9ff' : '#374151',
        boxShadow: connected ? '0 0 6px rgba(0,217,255,0.7)' : 'none',
        transition: 'background-color 0.4s, box-shadow 0.4s',
      }}
    />
    <span
      className="text-[11px] font-mono tracking-wider"
      style={{ color: connected ? '#9ca3af' : '#4b5563' }}
    >
      {label}
    </span>
  </div>
)

const Header = ({ socketConnected }) => {
  const [apiStatus, setApiStatus] = useState('checking') // 'ok' | 'down' | 'checking'
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const run = async () => {
      try {
        const result = await checkHealth()
        setApiStatus(result?.status === 'ok' ? 'ok' : 'down')
      } catch {
        setApiStatus('down')
      }
    }
    run()
    const iv = setInterval(run, 15000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })

  const apiOk = apiStatus === 'ok'

  return (
    <header
      className="relative z-20 sticky top-0"
      style={{
        background: 'rgba(7,9,16,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00d9ff 0%, #5b8fff 100%)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.5"/>
              <path d="M5 3V2M9 3V2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="4" y="6" width="6" height="3" rx="0.75" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <div className="leading-none">
            <div className="font-display font-700 text-base tracking-tight text-gradient-accent">
              TicketForge
            </div>
            <div className="text-[10px] font-mono text-muted/60 tracking-[0.12em] mt-0.5">
              DISTRIBUTED ENGINE
            </div>
          </div>
        </div>

        {/* Centre — event info */}
        <div className="hidden md:flex items-center gap-5 text-center">
          <div>
            <div className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">Event</div>
            <div className="text-sm font-display font-600 text-white mt-0.5">
              e456 · Main Arena
            </div>
          </div>
          <div className="w-px h-7 bg-border" />
          <div>
            <div className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">Time</div>
            <div className="text-sm font-mono text-accent mt-0.5 tabular-nums">{timeStr}</div>
          </div>
        </div>

        {/* Right — status pills */}
        <div className="flex items-center gap-2">
          {/* API Gateway */}
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: apiOk
                ? 'rgba(0,255,136,0.07)'
                : apiStatus === 'checking'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(255,59,107,0.08)',
              border: `1px solid ${
                apiOk ? 'rgba(0,255,136,0.2)' :
                apiStatus === 'checking' ? 'rgba(255,255,255,0.07)' :
                'rgba(255,59,107,0.2)'
              }`,
              transition: 'background 0.4s, border-color 0.4s',
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${apiOk ? 'live-dot' : ''}`}
              style={{
                backgroundColor: apiOk ? '#00ff88' : apiStatus === 'checking' ? '#4b5563' : '#ff3b6b',
                boxShadow: apiOk ? '0 0 6px rgba(0,255,136,0.7)' : 'none',
              }}
            />
            <span
              className="text-[11px] font-mono tracking-wider"
              style={{
                color: apiOk ? '#6ee7b7' : apiStatus === 'checking' ? '#4b5563' : '#fca5a5',
              }}
            >
              API {apiOk ? 'LIVE' : apiStatus === 'checking' ? '…' : 'DOWN'}
            </span>
          </div>

          {/* Socket */}
          <StatusPill connected={socketConnected} label={`WS ${socketConnected ? 'LIVE' : 'OFF'}`} />
        </div>
      </div>
    </header>
  )
}

export default Header
