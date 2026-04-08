const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const ORCHESTRATOR_URL = "http://localhost:8080/book";

// Health Check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Booking API
app.post("/book-ticket", async (req, res) => {
    try {
        const { seats, userId, eventId } = req.body;

        // 🔴 VALIDATION
        if (!Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ error: "Seats must be a non-empty array" });
        }

        if (!userId || !eventId) {
            return res.status(400).json({ error: "userId and eventId are required" });
        }

        // Optional: seat format validation (basic)
        const invalidSeats = seats.filter(seat => typeof seat !== "string" || seat.length < 2);
        if (invalidSeats.length > 0) {
            return res.status(400).json({ error: "Invalid seat IDs", invalidSeats });
        }

        // 🔵 PROCESS EACH SEAT
        const acceptedSeats = [];
        const failedSeats = [];

        const requests = seats.map(async (seat) => {
            try {
                await axios.post(ORCHESTRATOR_URL, {
                    seatId: seat,
                    userId,
                    eventId
                });
                acceptedSeats.push(seat);
            } catch (err) {
                failedSeats.push(seat);
            }
        });

        // Wait for all requests
        await Promise.all(requests);

        // 🔵 RESPONSE
        return res.status(202).json({
            success: true,
            waitlistId: "wl_" + Date.now(),
            requestedSeats: seats,
            acceptedSeats,
            failedSeats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3000, () => {
    console.log("API Gateway running on port 3000");
});