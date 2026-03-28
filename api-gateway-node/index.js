const express = require("express");
const Redis = require("ioredis");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// Redis connection
const redis = new Redis({
  host: "localhost",
  port: 6379
});

// Health check route
app.get("/", (req, res) => {
  res.send("API Gateway is running 🚀");
});

// Main booking route
app.post("/book-ticket", async (req, res) => {
  try {
    const { seatId, userId } = req.body;

    // Validation
    if (!seatId || !userId) {
      return res.status(400).json({
        error: "seatId and userId are required"
      });
    }

    // Generate unique waitlist ID
    const waitlistId = uuidv4();

    // Create booking request
    const bookingRequest = {
      waitlistId,
      seatId,
      userId,
      status: "PENDING",
      timestamp: new Date()
    };

    // Push to Redis queue
    await redis.lpush("ticketQueue", JSON.stringify(bookingRequest));

    // Immediate response (IMPORTANT)
    return res.status(202).json({
      message: "Request added to queue",
      waitlistId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// Start server
app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});