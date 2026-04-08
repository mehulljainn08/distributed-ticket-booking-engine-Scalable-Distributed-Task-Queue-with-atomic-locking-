const Redis = require("ioredis");
const axios = require("axios");
const express = require("express");

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "http://localhost:4000/webhook/booking-result";
const WORKER_PORT = process.env.WORKER_PORT || 5000;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    console.log(`[Redis] Reconnecting in ${delay}ms... (attempt ${times})`);
    return delay;
  },
});

redis.on("connect", () => console.log("[Redis] ✅ Connected successfully."));
redis.on("error", (err) => console.error("[Redis] ❌ Connection error:", err.message));

const app = express();
app.use(express.json());

let processedCount = 0;
let successCount = 0;
let failureCount = 0;

app.get("/health", (req, res) => {
  res.json({
    status: "Worker is running",
    stats: {
      processed: processedCount,
      confirmed: successCount,
      failed: failureCount,
    },
  });
});

app.listen(WORKER_PORT, () => {
  console.log(`[Worker] 🔧 Debug server on http://localhost:${WORKER_PORT}/health`);
});

function simulatePayment() {
  return new Promise((resolve) => {
    const delayMs = Math.floor(Math.random() * 4000) + 1000;
    const isSuccess = Math.random() < 0.8;

    console.log(
      `[Worker] 💳 Processing payment (${(delayMs / 1000).toFixed(1)}s delay)...`
    );

    setTimeout(() => resolve(isSuccess), delayMs);
  });
}

async function notifyWebhook(payload) {
  try {
    await axios.post(WEBHOOK_URL, payload);
    console.log(
      `[Worker] 📡 Webhook notified  →  ${payload.status.toUpperCase()} for seat ${payload.seatId}`
    );
  } catch (err) {
    console.error(
      `[Worker] ⚠️  Webhook call failed (${WEBHOOK_URL}): ${err.message}`
    );
  }
}

async function consumeQueue() {
  console.log("[Worker] 🚀 Worker started. Listening on queue:pending_bookings...\n");

  while (true) {
    try {
      const result = await redis.brpop("queue:pending_bookings", 0);

      if (!result) continue;

      const raw = result[1];
      let job;

      try {
        job = JSON.parse(raw);
      } catch (parseErr) {
        console.error("[Worker] ❌ Bad JSON in queue, skipping:", raw);
        continue;
      }

      const { waitlistId, seatId, userId, eventId,
              waitlist_id, seat_id, user_id, event_id } = job;

      const finalJob = {
        waitlistId: waitlistId || waitlist_id || "unknown",
        seatId:     seatId     || seat_id     || "unknown",
        userId:     userId     || user_id     || "unknown",
        eventId:    eventId    || event_id    || "unknown",
      };

      processedCount++;

      console.log(`[Worker] 🎫 Pulled job #${processedCount}`);
      console.log(
        `         User: ${finalJob.userId} | Seat: ${finalJob.seatId} | Event: ${finalJob.eventId}`
      );

      const paymentSuccess = await simulatePayment();
      const status = paymentSuccess ? "confirmed" : "failed";

      if (paymentSuccess) {
        successCount++;
        console.log(`[Worker] ✅ Payment SUCCESS → Seat ${finalJob.seatId} CONFIRMED`);
      } else {
        failureCount++;
        console.log(`[Worker] ❌ Payment FAILED  → Seat ${finalJob.seatId} REJECTED`);
      }

      await notifyWebhook({
        waitlistId: finalJob.waitlistId,
        seatId:     finalJob.seatId,
        userId:     finalJob.userId,
        eventId:    finalJob.eventId,
        status,
      });

      console.log("");

    } catch (err) {
      console.error("[Worker] 🔥 Fatal error:", err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

consumeQueue();
