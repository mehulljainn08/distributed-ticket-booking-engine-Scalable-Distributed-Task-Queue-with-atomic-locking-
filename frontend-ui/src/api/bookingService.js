// ═══════════════════════════════════════════════════════════════
// bookingService.js — API Layer
//
// PURPOSE: Single source of truth for all HTTP interactions.
// Currently uses mock implementations for frontend-only sprint.
//
// FUTURE INTEGRATION:
//   Set VITE_API_BASE_URL in .env.local when backend is ready.
//   Swap mock* functions for real fetch() calls.
//   This file is the ONLY place that needs to change.
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a ticket booking request to the API Gateway.
 *
 * Backend contract (once your teammate's Express gateway is ready):
 *   POST /book-ticket
 *   Body: { eventId, userId, seats: string[], timestamp: number }
 *
 *   Response (immediate — does NOT wait for worker to process):
 *   { waitlistId: "WL12345", position: 47, estimatedTime: 15, timestamp: ISO }
 *
 *   Notes:
 *   - The gateway immediately returns a waitlist ID (async pattern).
 *   - The actual booking is processed by worker nodes.
 *   - Redis atomic lock prevents double-booking same seat.
 *   - Final confirmation arrives via socket event (see seatSocket.js).
 *
 * @param {{ eventId: string, userId: string, seats: string[], timestamp: number }} payload
 * @returns {Promise<{ waitlistId: string, position: number, estimatedTime: number, timestamp: string }>}
 */
export async function submitBookingRequest(payload) {
  const { eventId, userId, seats, timestamp } = payload;
  
  const requests = seats.map(seatId => {
    return fetch(`${API_BASE_URL}/book-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID(),          // Idempotency key
        'X-Client-Version': '1.0.0',
      },
      body: JSON.stringify({ eventId, userId, seatId, timestamp }),
      signal: AbortSignal.timeout(10_000),             // 10s timeout
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new APIError(res.status, err.message || 'Booking Request failed');
      }
      return res.json();
    });
  });
  
  const results = await Promise.all(requests);
  
  // For WaitlistModal, aggregate into a single object representation:
  return {
    waitlistId: results.length > 1 ? `${results[0].waitlistId} (+${results.length - 1} more)` : results[0].waitlistId,
    position: results[0]?.position || 0,
    estimatedTime: results[0]?.estimatedTime || 0,
    workerNode: results[0]?.workerNode || 'various',
    redisLockAcquired: true,
  };
}

/**
 * Poll booking status by waitlist ID.
 *
 * Future endpoint: GET /booking-status/:waitlistId
 * Response: { waitlistId, status: 'PENDING'|'PROCESSING'|'CONFIRMED'|'FAILED', updatedAt }
 *
 * @param {string} waitlistId
 * @returns {Promise<{ waitlistId: string, status: string, updatedAt: string }>}
 */
export async function getBookingStatus(waitlistId) {
  // ── FUTURE ─────────────────────────────────────────────────────────────────
  // const response = await fetch(`${API_BASE_URL}/booking-status/${waitlistId}`, {
  //   headers: { 'Cache-Control': 'no-cache' },
  //   signal: AbortSignal.timeout(5_000),
  // });
  // if (!response.ok) throw new APIError(response.status, 'Status check failed');
  // return response.json();
  // ──────────────────────────────────────────────────────────────────────────

  return _mockGetStatus(waitlistId);
}

/**
 * Fetch available seats for an event from the database.
 *
 * Future endpoint: GET /events/:eventId/seats
 * Response: { seats: SeatObject[], updatedAt: ISO }
 *
 * Currently using local generateSeats() instead.
 */
export async function fetchEventSeats(eventId) {
  // ── FUTURE ─────────────────────────────────────────────────────────────────
  // const response = await fetch(`${API_BASE_URL}/events/${eventId}/seats`);
  // if (!response.ok) throw new APIError(response.status, 'Failed to fetch seats');
  // return response.json();
  // ──────────────────────────────────────────────────────────────────────────

  // Currently handled by local seatData.js → generateSeats()
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS  (delete this section once backend is live)
// ─────────────────────────────────────────────────────────────────────────────

async function _mockSubmitBooking(payload) {
  // Simulate API Gateway processing delay (600ms–1400ms)
  await _delay(Math.random() * 800 + 600);

  // Simulate ~8% server-overload failure for distributed system realism
  if (Math.random() < 0.08) {
    throw new APIError(503, 'Worker queue at capacity. Please retry in a moment.');
  }

  const waitlistIds = payload.seats.map((_, i) => `WL-${Date.now().toString(36).toUpperCase().slice(-6)}-${i}`);
  const displayId = waitlistIds.length > 1 ? `${waitlistIds[0]} (+${waitlistIds.length - 1} more)` : waitlistIds[0];

  return {
    waitlistId: displayId,
    position:      Math.floor(Math.random() * 120) + 10,
    estimatedTime: Math.floor(Math.random() * 20)  + 8,   // seconds
    seatCount:     payload.seats.length,
    timestamp:     new Date().toISOString(),
    workerNode:    `worker-${Math.floor(Math.random() * 4) + 1}`,
    redisLockAcquired: true,
  };
}

async function _mockGetStatus(waitlistId) {
  await _delay(Math.random() * 400 + 200);
  const statuses = ['PENDING', 'PROCESSING', 'CONFIRMED'];
  return {
    waitlistId,
    status:    statuses[Math.floor(Math.random() * statuses.length)],
    updatedAt: new Date().toISOString(),
  };
}

function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
