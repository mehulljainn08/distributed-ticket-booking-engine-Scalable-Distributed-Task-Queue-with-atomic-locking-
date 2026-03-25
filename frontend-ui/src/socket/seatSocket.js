// ═══════════════════════════════════════════════════════════════
// seatSocket.js — Real-Time Seat Update Service
//
// PURPOSE: Abstracts all WebSocket / Socket.IO interactions.
// Connects to your teammate's DB + webhook/socket update system.
//
// ARCHITECTURE:
//   Backend emits 'seatBooked' → Frontend marks seat as sold.
//   Redis atomic lock ensures no two users book the same seat.
//
// FUTURE INTEGRATION:
//   npm install socket.io-client
//   Set VITE_SOCKET_URL in .env.local
//   Uncomment the socket.io block below.
// ═══════════════════════════════════════════════════════════════

// ── FUTURE: import { io } from 'socket.io-client'; ────────────

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';

let _socket = null;
let _seatUpdateHandlers  = [];
let _connectionHandlers  = [];
let _bookingConfirmHandlers = [];
let _mockTimers = [];

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the socket connection.
 * Call once on app mount.
 */
export function initSocket() {
  // ── FUTURE: Replace with real socket.io connection ────────────────────────
  //
  // _socket = io(SOCKET_URL, {
  //   transports: ['websocket'],
  //   reconnectionAttempts: 5,
  //   reconnectionDelay: 1000,
  //   auth: { token: localStorage.getItem('auth_token') },
  // });
  //
  // _socket.on('connect', () => {
  //   console.log('[Socket] Connected:', _socket.id);
  //   _connectionHandlers.forEach(h => h({ connected: true, id: _socket.id }));
  // });
  //
  // _socket.on('disconnect', (reason) => {
  //   console.warn('[Socket] Disconnected:', reason);
  //   _connectionHandlers.forEach(h => h({ connected: false }));
  // });
  //
  // // Teammate's backend emits this event when a seat is booked by any user
  // _socket.on('seatBooked', ({ seatId, status, bookedBy }) => {
  //   _seatUpdateHandlers.forEach(h => h({ seatId, status: 'sold' }));
  // });
  //
  // // Teammate's backend emits this when Redis lock expires + seat is released
  // _socket.on('seatReleased', ({ seatId }) => {
  //   _seatUpdateHandlers.forEach(h => h({ seatId, status: 'available' }));
  // });
  //
  // // Worker node emits when YOUR waitlisted booking is confirmed
  // _socket.on('bookingConfirmed', ({ waitlistId, seats, status }) => {
  //   _bookingConfirmHandlers.forEach(h => h({ waitlistId, seats, status }));
  // });
  //
  // ──────────────────────────────────────────────────────────────────────────

  _startMockUpdates();
  console.info('[Socket] Running in mock mode. Connect to backend when ready.');
}

/**
 * Subscribe to real-time seat status changes.
 * Fires whenever another user books a seat.
 *
 * @param {function({ seatId: string, status: 'sold'|'available' }): void} handler
 * @returns {function} unsubscribe function
 */
export function onSeatUpdate(handler) {
  _seatUpdateHandlers.push(handler);
  return () => {
    _seatUpdateHandlers = _seatUpdateHandlers.filter(h => h !== handler);
  };
}

/**
 * Subscribe to your booking confirmation events (from worker node).
 * Fires when your waitlisted booking is processed.
 *
 * @param {function({ waitlistId: string, seats: string[], status: string }): void} handler
 * @returns {function} unsubscribe function
 */
export function onBookingConfirmed(handler) {
  _bookingConfirmHandlers.push(handler);
  return () => {
    _bookingConfirmHandlers = _bookingConfirmHandlers.filter(h => h !== handler);
  };
}

/**
 * Subscribe to connection status changes.
 * @param {function({ connected: boolean, id?: string }): void} handler
 * @returns {function} unsubscribe function
 */
export function onConnectionChange(handler) {
  _connectionHandlers.push(handler);
  return () => {
    _connectionHandlers = _connectionHandlers.filter(h => h !== handler);
  };
}

/**
 * Request optimistic seat lock before booking.
 * Informs Redis layer that this client is about to attempt booking.
 *
 * Future: socket.emit('lockSeats', { seatIds, userId, ttlMs: 30000 });
 *
 * @param {string[]} seatIds
 * @param {string} userId
 */
export function emitSeatLockRequest(seatIds, userId) {
  if (_socket) {
    // FUTURE: _socket.emit('lockSeats', { seatIds, userId, ttlMs: 30_000 });
  }
  console.debug('[Socket] Lock request (stub):', seatIds);
}

/**
 * Join an event's socket room to receive its seat updates.
 * Future: socket.emit('joinEvent', { eventId });
 *
 * @param {string} eventId
 */
export function joinEventRoom(eventId) {
  if (_socket) {
    // FUTURE: _socket.emit('joinEvent', { eventId });
  }
}

export function disconnectSocket() {
  if (_socket) {
    // FUTURE: _socket.disconnect();
  }
  _stopMockUpdates();
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATION  (simulates other users booking in real time)
// Remove _startMockUpdates / _stopMockUpdates once socket is live.
// ─────────────────────────────────────────────────────────────────────────────

// Seats eligible for mock "booked by other user" events
const _MOCK_AVAILABLE_POOL = [
  'A1', 'A3', 'A5', 'A6', 'A8', 'A9',
  'B2', 'B4', 'B5', 'B7', 'B8', 'B10', 'B12',
  'C1', 'C3', 'C4', 'C6', 'C7', 'C9', 'C10',
  'D2', 'D3', 'D5', 'D6', 'D8', 'D10', 'D11',
];

let _mockPoolIndex = 0;

function _startMockUpdates() {
  const _schedule = () => {
    // Book a random seat every 10–20 seconds
    const delay = Math.floor(Math.random() * 10_000) + 10_000;
    const timerId = setTimeout(() => {
      if (_mockPoolIndex < _MOCK_AVAILABLE_POOL.length) {
        const seatId = _MOCK_AVAILABLE_POOL[_mockPoolIndex++];
        _seatUpdateHandlers.forEach(h => h({ seatId, status: 'sold' }));
      }
      _schedule();
    }, delay);
    _mockTimers.push(timerId);
  };
  _schedule();
}

function _stopMockUpdates() {
  _mockTimers.forEach(clearTimeout);
  _mockTimers = [];
}
