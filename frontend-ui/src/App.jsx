import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import SeatGrid from './components/SeatGrid'
import BookingPanel from './components/BookingPanel'
import BookingModal from './components/BookingModal'
import ActivityFeed from './components/ActivityFeed'
import LiveStats from './components/LiveStats'
import { bookTickets } from './services/api'
import { getSocket } from './services/socket'
import { useSocket } from './hooks/useSocket'
import {
  createActivityItem,
  appendActivity,
  EVENT_ID,
  USER_ID,
} from './utils/seatHelpers'

// ─── Toast notification component ─────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className="animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono max-w-xs"
        style={{
          background:
            t.type === 'success' ? 'rgba(0,255,136,0.15)' :
            t.type === 'error'   ? 'rgba(255,59,107,0.15)' :
            'rgba(0,217,255,0.12)',
          border: `1px solid ${
            t.type === 'success' ? 'rgba(0,255,136,0.3)' :
            t.type === 'error'   ? 'rgba(255,59,107,0.3)' :
            'rgba(0,217,255,0.25)'
          }`,
          backdropFilter: 'blur(12px)',
          color:
            t.type === 'success' ? '#00ff88' :
            t.type === 'error'   ? '#ff3b6b' :
            '#00d9ff',
        }}
      >
        <span>
          {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '●'}
        </span>
        <span className="text-white/90">{t.message}</span>
      </div>
    ))}
  </div>
)

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Seat state ────────────────────────────────────────────────────────────
  const [selectedSeats, setSelectedSeats] = useState([])
  const [soldSeats, setSoldSeats] = useState(new Set())
  const [pendingSeats, setPendingSeats] = useState(new Set())

  // ── Booking state ──────────────────────────────────────────────────────────
  const [bookingStatus, setBookingStatus] = useState('idle') // idle|loading|success|partial|failed
  const [waitlistData, setWaitlistData] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Activity feed ──────────────────────────────────────────────────────────
  const [activityFeed, setActivityFeed] = useState([])

  // ── Live stats ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    activeRequests: 0,
    queueDepth: 0,
    confirmed: 0,
    failed: 0,
  })

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([])
  const toastTimeout = useRef({})

  // ── Socket connection status ───────────────────────────────────────────────
  const [socketConnected, setSocketConnected] = useState(false)

  // ─── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    toastTimeout.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  // ─── Cleanup toast timers on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => Object.values(toastTimeout.current).forEach(clearTimeout)
  }, [])

  // ─── Monitor socket connection status ─────────────────────────────────────
  // Read .connected after a short tick so the handshake has time to complete,
  // then track via events. Mock socket sets connected=true synchronously.
  useEffect(() => {
    let sock
    try { sock = getSocket() } catch { setSocketConnected(false); return }

    const onConnect    = () => setSocketConnected(true)
    const onDisconnect = () => setSocketConnected(false)
    const onError      = () => setSocketConnected(false)

    sock.on('connect',       onConnect)
    sock.on('disconnect',    onDisconnect)
    sock.on('connect_error', onError)

    // Mock socket is synchronously connected; real socket — check after tick
    if (sock.id === 'mock-socket') {
      setSocketConnected(true)
    } else {
      const t = setTimeout(() => setSocketConnected(sock.connected ?? false), 150)
      return () => {
        clearTimeout(t)
        sock.off?.('connect',       onConnect)
        sock.off?.('disconnect',    onDisconnect)
        sock.off?.('connect_error', onError)
      }
    }

    return () => {
      sock.off?.('connect',       onConnect)
      sock.off?.('disconnect',    onDisconnect)
      sock.off?.('connect_error', onError)
    }
  }, [])

  // ─── Socket event handlers ─────────────────────────────────────────────────
  const handleSeatUpdated = useCallback(({ seatId, status }) => {
    if (status === 'sold') {
      setSoldSeats((prev) => new Set([...prev, seatId]))
      setPendingSeats((prev) => { const next = new Set(prev); next.delete(seatId); return next })
      setSelectedSeats((prev) => prev.filter((s) => s !== seatId))
      setActivityFeed((prev) => appendActivity(prev, createActivityItem('sold', seatId)))
    }
  }, [])

  const handleBookingConfirmed = useCallback(({ seatId, waitlistId }) => {
    setSoldSeats((prev) => new Set([...prev, seatId]))
    setPendingSeats((prev) => { const next = new Set(prev); next.delete(seatId); return next })
    setStats((prev) => ({ ...prev, confirmed: prev.confirmed + 1 }))
    setActivityFeed((prev) => appendActivity(prev, createActivityItem('confirmed', seatId, waitlistId)))
    addToast(`Seat ${seatId} confirmed ✓`, 'success')
  }, [addToast])

  const handleBookingFailed = useCallback(({ seatId, waitlistId }) => {
    setPendingSeats((prev) => { const next = new Set(prev); next.delete(seatId); return next })
    setStats((prev) => ({ ...prev, failed: prev.failed + 1 }))
    setActivityFeed((prev) => appendActivity(prev, createActivityItem('failed', seatId, waitlistId)))
    addToast(`Seat ${seatId} payment failed`, 'error')
  }, [addToast])

  useSocket({
    onSeatUpdated: handleSeatUpdated,
    onBookingConfirmed: handleBookingConfirmed,
    onBookingFailed: handleBookingFailed,
  })

  // ─── Seat click handler ────────────────────────────────────────────────────
  const handleSeatClick = useCallback((seatId) => {
    // Guard: never select a sold or pending seat (race-condition safety)
    setSoldSeats((currentSold) => {
      setPendingSeats((currentPending) => {
        if (currentSold.has(seatId) || currentPending.has(seatId)) return currentPending
        setSelectedSeats((prev) =>
          prev.includes(seatId)
            ? prev.filter((s) => s !== seatId)
            : [...prev, seatId]
        )
        return currentPending
      })
      return currentSold
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedSeats([])
  }, [])

  // ─── Confirm booking ───────────────────────────────────────────────────────
  const handleConfirmBooking = useCallback(async () => {
    if (selectedSeats.length === 0 || loading) return

    // ── Snapshot seats BEFORE any state mutation ─────────────────────────────
    // This is critical: selectedSeats is cleared below; we need the snapshot
    // for both the API call and the failure-path cleanup.
    const seatsSnapshot = [...selectedSeats]

    setLoading(true)
    setBookingStatus('loading')
    // Clear previous result so the panel doesn't show stale data (Bug 5)
    setWaitlistData(null)
    setStats((prev) => ({
      ...prev,
      activeRequests: prev.activeRequests + 1,
      queueDepth: prev.queueDepth + seatsSnapshot.length,
    }))

    // Mark seats pending immediately, clear selection
    setPendingSeats((prev) => new Set([...prev, ...seatsSnapshot]))
    setSelectedSeats([])

    // Log to activity feed
    seatsSnapshot.forEach((seatId) => {
      setActivityFeed((prev) => appendActivity(prev, createActivityItem('pending', seatId)))
    })

    let result
    try {
      result = await bookTickets(seatsSnapshot, USER_ID, EVENT_ID)
    } catch (err) {
      result = {
        success: false,
        message: err.userMessage || 'Network error — API Gateway may be offline',
        // Attach snapshot so failure path can clean up (Bug 1 fix)
        _seatsSnapshot: seatsSnapshot,
      }
    }

    setLoading(false)
    setStats((prev) => ({ ...prev, activeRequests: Math.max(0, prev.activeRequests - 1) }))
    setWaitlistData(result)
    setModalOpen(true)

    if (result.success) {
      const hasPartial = result.failedSeats?.length > 0
      setBookingStatus(hasPartial ? 'partial' : 'success')

      // Release failed seats from pending back to available
      if (result.failedSeats?.length > 0) {
        setPendingSeats((prev) => {
          const next = new Set(prev)
          result.failedSeats.forEach((s) => next.delete(s))
          return next
        })
        result.failedSeats.forEach((seatId) => {
          setActivityFeed((prev) =>
            appendActivity(prev, createActivityItem('failed', seatId, result.waitlistId))
          )
        })
        addToast(`${result.failedSeats.length} seat(s) could not be locked`, 'error')
      }

      if (result.acceptedSeats?.length > 0) {
        result.acceptedSeats.forEach((seatId) => {
          setActivityFeed((prev) =>
            appendActivity(prev, createActivityItem('submitted', seatId, result.waitlistId))
          )
        })
        addToast(`${result.acceptedSeats.length} seat(s) queued for payment`, 'success')
      }
    } else {
      setBookingStatus('failed')

      // Bug 1 fix: use acceptedSeats+failedSeats if available (partial backend response),
      // otherwise fall back to our local snapshot so pending ALWAYS gets cleared.
      const toRelease =
        result.requestedSeats?.length > 0
          ? result.requestedSeats
          : result._seatsSnapshot ?? seatsSnapshot

      setPendingSeats((prev) => {
        const next = new Set(prev)
        toRelease.forEach((s) => next.delete(s))
        return next
      })

      if (result.failedSeat) {
        setActivityFeed((prev) =>
          appendActivity(prev, createActivityItem('failed', result.failedSeat))
        )
      } else {
        // Log all released seats when no specific failedSeat given (network error case)
        toRelease.forEach((seatId) => {
          setActivityFeed((prev) =>
            appendActivity(prev, createActivityItem('failed', seatId))
          )
        })
      }

      addToast(result.message || 'Booking failed', 'error')
    }
  }, [selectedSeats, loading, addToast])

  // ─── Close modal ───────────────────────────────────────────────────────────
  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    // Always schedule idle reset — safe regardless of current status
    setTimeout(() => setBookingStatus((s) => (s !== 'loading' ? 'idle' : s)), 300)
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-void grid-bg relative">
      {/* Ambient background blobs */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,217,255,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(91,143,255,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Header */}
      <Header socketConnected={socketConnected} />

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* Live stats */}
        <LiveStats stats={stats} />

        {/* Mock mode banner */}
        {import.meta.env.VITE_MOCK_MODE === 'true' && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono"
            style={{
              background: 'rgba(255,184,0,0.08)',
              border: '1px solid rgba(255,184,0,0.2)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#ffb800" strokeWidth="1.5"/>
              <path d="M7 4.5v3.5M7 9.5h.01" stroke="#ffb800" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-warning">
              MOCK MODE ACTIVE — simulated events firing every 4–8s. Set <code className="text-white">VITE_MOCK_MODE=false</code> to connect to real backend.
            </span>
          </div>
        )}

        {/* Seat map + booking panel */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: event info + seat grid */}
          <div className="flex flex-col gap-4">
            {/* Event header strip */}
            <div
              className="rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
              style={{
                background: 'linear-gradient(135deg, rgba(0,217,255,0.06) 0%, rgba(91,143,255,0.06) 100%)',
                border: '1px solid rgba(0,217,255,0.12)',
              }}
            >
              <div>
                <h1 className="font-display font-800 text-xl text-white tracking-tight">
                  Live Concert · Main Arena
                </h1>
                <p className="text-xs font-mono text-muted mt-1">
                  Event ID: <span className="text-accent">e456</span>
                  &nbsp;·&nbsp;
                  {selectedSeats.length > 0
                    ? <span className="text-amber-400">{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected</span>
                    : <span>Click seats to select</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-mono"
                  style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}
                >
                  ● ON SALE
                </div>
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-muted"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  TATKAL MODE
                </div>
              </div>
            </div>

            {/* Seat Grid */}
            <SeatGrid
              selectedSeats={selectedSeats}
              soldSeats={soldSeats}
              pendingSeats={pendingSeats}
              onSeatClick={handleSeatClick}
            />
          </div>

          {/* Right: booking panel */}
          <BookingPanel
            selectedSeats={selectedSeats}
            bookingStatus={bookingStatus}
            waitlistData={waitlistData}
            onConfirmBooking={handleConfirmBooking}
            onClearSelection={handleClearSelection}
            loading={loading}
          />
        </div>

        {/* Activity feed */}
        <ActivityFeed activities={activityFeed} />

        {/* Footer */}
        <footer className="text-center text-xs font-mono text-muted/40 py-4">
          TicketForge · Distributed Booking Engine · Frontend → API Gateway → Go Orchestrator → Redis → Worker → DB/Socket
        </footer>
      </main>

      {/* Booking modal */}
      <BookingModal isOpen={modalOpen} onClose={handleCloseModal} data={waitlistData} />

      {/* Toast container */}
      <Toast toasts={toasts} />
    </div>
  )
}
