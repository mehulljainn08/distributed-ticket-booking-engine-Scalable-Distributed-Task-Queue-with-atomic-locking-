const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors")

const app = express();

app.use(cors());
app.use(express.json());

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://localhost:8080";
const PORT = process.env.PORT || 3000;
// Health check route
app.get("/", (req, res) => {
  res.send("API Gateway is running 🚀");
});

// Main booking route
app.post("/book-ticket", async (req, res) => {
  try {
    const { seatId, userId, eventId } = req.body;

    // Validation
    if (!seatId || !userId || !eventId) {
      return res.status(400).json({
        error: "seatId, userId and eventId are required"
      });
    }

    // Generate unique waitlist ID
    const waitlistId = uuidv4();

    // Call Go Orchestrator
    const response = await axios.post(`${ORCHESTRATOR_URL}/book`, {
      user_id: userId,
      seat_id: seatId,
      event_id: eventId
    });

    // If Go returns success
    if (response.status === 200) {
      return res.status(200).json({
        message: "Request accepted and queued",
        waitlistId
      });
    }

  } catch (err) {
    console.error("Error:", err.message);

    // If seat already taken
    if (err.response && err.response.status === 409) {
      return res.status(409).json({
        error: "Seat already booked"
      });
    }

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});