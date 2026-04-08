// ─── Seat Grid Configuration ───────────────────────────────────────────────────
export const ROWS = ['A', 'B', 'C', 'D', 'E']
export const COLS = [1, 2, 3, 4, 5, 6, 7, 8]

export const EVENT_ID = 'e456'
export const USER_ID = 'u123'

// ─── Generate all seat IDs ─────────────────────────────────────────────────────
export const generateAllSeats = () => {
  return ROWS.flatMap((row) => COLS.map((col) => `${row}${col}`))
}

// ─── Seat state types ──────────────────────────────────────────────────────────
export const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  SOLD: 'sold',
  PENDING: 'pending',
}

// ─── Get seat display class based on status ────────────────────────────────────
export const getSeatStyle = (seatId, selectedSeats, soldSeats, pendingSeats) => {
  if (soldSeats.has(seatId)) return SEAT_STATUS.SOLD
  if (pendingSeats.has(seatId)) return SEAT_STATUS.PENDING
  if (selectedSeats.includes(seatId)) return SEAT_STATUS.SELECTED
  return SEAT_STATUS.AVAILABLE
}

// ─── Format seat list for display ─────────────────────────────────────────────
export const formatSeatList = (seats) => {
  if (!seats || seats.length === 0) return '—'
  return seats.join(', ')
}

// ─── Generate a mock waitlist ID ───────────────────────────────────────────────
export const generateWaitlistId = () => {
  return `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Activity feed helpers ─────────────────────────────────────────────────────
export const MAX_ACTIVITY_ITEMS = 10

export const createActivityItem = (type, seatId, waitlistId = null) => ({
  id: `${Date.now()}-${Math.random()}`,
  type,   // 'sold' | 'confirmed' | 'failed' | 'pending' | 'submitted'
  seatId,
  waitlistId,
  timestamp: new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }),
})

export const appendActivity = (feed, item) => {
  return [item, ...feed].slice(0, MAX_ACTIVITY_ITEMS)
}
