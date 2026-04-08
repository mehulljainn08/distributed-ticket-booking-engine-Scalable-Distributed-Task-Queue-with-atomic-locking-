import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7000'
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

let socket = null

// ─── Get or create socket instance ────────────────────────────────────────────
export const getSocket = () => {
  if (socket) return socket

  if (MOCK_MODE) {
    console.info('[Socket] Mock mode – socket not connecting to real server')
    return createMockSocket()
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.info(`[Socket] Connected → ${socket.id}`)
  })

  socket.on('disconnect', (reason) => {
    console.warn(`[Socket] Disconnected: ${reason}`)
  })

  socket.on('connect_error', (err) => {
    console.warn(`[Socket] Connection error: ${err.message}`)
  })

  socket.on('reconnect', (attempt) => {
    console.info(`[Socket] Reconnected after ${attempt} attempt(s)`)
  })

  return socket
}

// ─── Disconnect cleanly ────────────────────────────────────────────────────────
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// ─── Mock socket for development without backend ──────────────────────────────
const createMockSocket = () => {
  const listeners = {}

  const mockSocket = {
    id: 'mock-socket',
    connected: true,
    on: (event, cb) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(cb)
    },
    off: (event, cb) => {
      if (!listeners[event]) return
      listeners[event] = listeners[event].filter((l) => l !== cb)
    },
    emit: (event, data) => {
      if (listeners[event]) listeners[event].forEach((cb) => cb(data))
    },
    disconnect: () => {},
    _trigger: (event, data) => {
      if (listeners[event]) listeners[event].forEach((cb) => cb(data))
    },
  }

  // Simulate random seat updates every 4–8 seconds
  const seats = ['A1','A2','A3','B1','B2','C3','C4','D1','D5','E2','E7']
  const simulateEvents = () => {
    const seat = seats[Math.floor(Math.random() * seats.length)]
    const roll = Math.random()

    if (roll < 0.5) {
      mockSocket._trigger('seatUpdated', { seatId: seat, status: 'sold' })
    } else if (roll < 0.75) {
      mockSocket._trigger('bookingConfirmed', {
        seatId: seat,
        waitlistId: `wl_${Date.now()}`,
      })
    } else {
      mockSocket._trigger('bookingFailed', {
        seatId: seat,
        waitlistId: `wl_${Date.now()}`,
      })
    }

    setTimeout(simulateEvents, 4000 + Math.random() * 4000)
  }

  setTimeout(simulateEvents, 3000)

  socket = mockSocket
  return mockSocket
}

// ─── Event name constants ──────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  SEAT_UPDATED: 'seatUpdated',
  BOOKING_CONFIRMED: 'bookingConfirmed',
  BOOKING_FAILED: 'bookingFailed',
}
