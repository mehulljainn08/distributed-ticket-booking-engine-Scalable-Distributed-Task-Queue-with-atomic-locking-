// Quick test script to push a sample job into the Redis queue
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

const testJob = {
  waitlistId: "wl_12345",
  seatId: "A1",
  userId: "u123",
  eventId: "e456",
};

async function pushTestJob() {
  await redis.rpush("queue:pending_bookings", JSON.stringify(testJob));
  console.log("✅ Test job pushed:", testJob);
  redis.disconnect();
}

pushTestJob();
