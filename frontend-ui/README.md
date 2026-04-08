# TicketForge — Frontend UI

> React + Vite frontend for the Distributed Ticket Booking Engine.  
> Connects to: **API Gateway** (`:5000`) and **Socket.IO Webhook Service** (`:7000`).

---

## Quick Start

### 1. Install dependencies

```bash
cd frontend-ui
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000      # Anand's API Gateway
VITE_SOCKET_URL=http://localhost:7000   # Dhruv's Socket service
VITE_MOCK_MODE=false                    # true = no backend needed
```

### 3. Run development server

```bash
npm run dev
```

Open → http://localhost:3000

---

## Mock Mode (no backend required)

Run without any backend services:

```bash
VITE_MOCK_MODE=true npm run dev
```

What mock mode does:
- API calls return simulated booking responses after 800ms
- Socket events fire automatically every 4–8 seconds
- Seats get sold/confirmed/failed at random to demonstrate real-time behavior
- A yellow banner in the UI shows mock mode is active

---

## Production Build

```bash
npm run build       # outputs to dist/
npm run preview     # preview production build locally
```

---

## Docker

### Build image

```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  --build-arg VITE_SOCKET_URL=http://localhost:7000 \
  -t ticketforge-frontend .
```

### Run container

```bash
docker run -p 3000:80 ticketforge-frontend
```

### Docker Compose (add to your docker-compose.yml)

```yaml
frontend:
  build:
    context: ./frontend-ui
    args:
      VITE_API_URL: http://api-gateway:5000
      VITE_SOCKET_URL: http://database-webhooknode:7000
      VITE_MOCK_MODE: "false"
  ports:
    - "3000:80"
  depends_on:
    - api-gateway
    - database-webhooknode
```

---

## Backend URL Reference

| Variable | Default | Used in |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | `src/services/api.js` |
| `VITE_SOCKET_URL` | `http://localhost:7000` | `src/services/socket.js` |

Change these in `.env` or as Docker build args.

---

## Project Structure

```
frontend-ui/
├── src/
│   ├── components/
│   │   ├── Header.jsx        # Nav bar + API/WS status indicators
│   │   ├── SeatGrid.jsx      # Full A–E × 1–8 stadium seat map
│   │   ├── Seat.jsx          # Individual seat (available/selected/pending/sold)
│   │   ├── BookingPanel.jsx  # Right panel: selection + CTA + booking result
│   │   ├── BookingModal.jsx  # Success / partial / failure modal
│   │   ├── ActivityFeed.jsx  # Live event ticker (last 10 events)
│   │   └── LiveStats.jsx     # Animated stats: requests / queue / confirmed / failed
│   │
│   ├── services/
│   │   ├── api.js            # Axios instance + bookTickets() POST /book-ticket
│   │   └── socket.js         # Socket.IO client + mock socket fallback
│   │
│   ├── hooks/
│   │   └── useSocket.js      # Safe subscribe/unsubscribe for seatUpdated / bookingConfirmed / bookingFailed
│   │
│   ├── utils/
│   │   └── seatHelpers.js    # Seat generation, status helpers, activity feed helpers
│   │
│   ├── App.jsx               # Root: all state, booking flow, socket wiring
│   ├── main.jsx
│   └── index.css             # Tailwind + custom CSS (glassmorphism, glow, animations)
│
├── .env.example
├── Dockerfile
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## API Contracts Implemented

### POST /book-ticket → API Gateway (Anand)

Request:
```json
{
  "seats": ["A1", "A2"],
  "userId": "u123",
  "eventId": "e456"
}
```

Success response handled:
```json
{
  "success": true,
  "waitlistId": "wl_12345",
  "requestedSeats": ["A1", "A2"],
  "acceptedSeats": ["A1"],
  "failedSeats": ["A2"]
}
```

Failure response handled:
```json
{
  "success": false,
  "message": "Unable to lock all requested seats",
  "failedSeat": "A3"
}
```

### Socket.IO Events → Webhook Service (Dhruv)

| Event | Payload | Frontend action |
|---|---|---|
| `seatUpdated` | `{ seatId, status: "sold" }` | Seat turns red instantly |
| `bookingConfirmed` | `{ seatId, waitlistId }` | Toast + activity feed + stats++ |
| `bookingFailed` | `{ seatId, waitlistId }` | Remove pending + toast + stats++ |

---

## Booking Flow

1. User clicks seats → yellow (selected)
2. User clicks **Confirm Booking**
3. Selected seats turn blue (pending) immediately
4. POST `/book-ticket` sent to API Gateway
5. Modal opens with waitlistId / accepted / failed seats
6. As Worker processes → Socket events arrive:
   - `bookingConfirmed` → seat turns red, success toast
   - `bookingFailed` → pending removed, error toast
   - `seatUpdated` → seat turns red (another user booked it)

---

## Testing Checklist

- [ ] Seat selection (single + multi)
- [ ] Deselect by clicking selected seat
- [ ] Confirm booking → modal opens with correct data
- [ ] Partial success (some seats accepted, some failed)
- [ ] Full failure response displayed correctly
- [ ] seatUpdated socket event → seat turns red without page refresh
- [ ] bookingConfirmed socket event → toast + activity feed
- [ ] bookingFailed socket event → pending cleared + toast
- [ ] LiveStats counters animate on confirmed/failed events
- [ ] Activity feed shows last 10 events newest-first
- [ ] Mock mode works with no backend running
- [ ] App does not crash if API Gateway is down
- [ ] App does not crash if Socket service is down
- [ ] Header shows correct API / WS status indicators
