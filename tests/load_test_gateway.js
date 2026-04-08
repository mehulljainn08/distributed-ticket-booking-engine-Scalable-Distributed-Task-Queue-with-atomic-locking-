import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Stage 1: Intense contention on a single seat
    // Stage 2: Mass throughput on random seats
    scenarios: {
        contention: {
            executor: 'constant-vus',
            vus: 50,
            duration: '10s',
            gracefulStop: '2s',
        },
        throughput: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 200 }, // Ramp up to 200 simultaneous users
                { duration: '1m', target: 200 },  // Hold for 1 minute
                { duration: '30s', target: 0 },   // Cool down
            ],
            startTime: '10s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'], // less than 1% errors
        http_req_duration: ['p(95)<300'], // 95% of requests < 300ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    const scenario = __ITER % 2 === 0 ? 'contention' : 'throughput';
    
    // For contention, 50 users try the exact same seat simultaneously
    const seatID = scenario === 'contention' ? 'seat_FRONT_ROW_01' : `seat_${__VU}_${__ITER}`;
    const userID = `user_${__VU}_${__ITER}`;
    const eventID = 'concert_coldplay';

    const payload = JSON.stringify({
        userId: userID,
        seatId: seatID,
        eventId: eventID,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // ── Attempt to Book via API Gateway & NGINX ──
    const res = http.post(`${BASE_URL}/book-ticket`, payload, params);

    check(res, {
        'status is 200 (Success) or 409 (Conflict)': (r) => [200, 409].includes(r.status),
        'status is not 500': (r) => r.status !== 500,
    });

    sleep(Math.random() * 0.5); // Random delay to simulate human jitter
}
