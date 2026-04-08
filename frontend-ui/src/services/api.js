import axios from 'axios'

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ─── Axios Instance ────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error'
    return Promise.reject({ ...error, userMessage: message })
  },
)

// ─── Mock fallback ─────────────────────────────────────────────────────────────
const mockBookTickets = async (seats, userId, eventId) => {
  await new Promise((r) => setTimeout(r, 800))
  const waitlistId = `wl_${Date.now()}`
  const failedSeats = seats.length > 1 ? [seats[seats.length - 1]] : []
  const acceptedSeats = seats.filter((s) => !failedSeats.includes(s))
  return {
    success: true,
    waitlistId,
    requestedSeats: seats,
    acceptedSeats,
    failedSeats,
  }
}

// ─── Book Tickets ──────────────────────────────────────────────────────────────
/**
 * POST /book-ticket
 * Exact payload: { seats: string[], userId: string, eventId: string }
 */
export const bookTickets = async (seats, userId, eventId) => {
  if (MOCK_MODE) {
    console.info('[API] Mock mode – bypassing real API Gateway')
    return mockBookTickets(seats, userId, eventId)
  }

  try {
    const response = await apiClient.post('/book-ticket', {
      seats,
      userId,
      eventId,
    })
    return response.data
  } catch (error) {
    // Return structured failure if server returned error body
    if (error.response?.data) {
      return error.response.data
    }
    throw error
  }
}

// ─── Health Check ──────────────────────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch {
    return null
  }
}
