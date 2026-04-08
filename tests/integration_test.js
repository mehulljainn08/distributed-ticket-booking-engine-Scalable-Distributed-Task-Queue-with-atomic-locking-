const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:5000';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runIntegrationTest() {
    console.log("🚀 Starting End-to-End Integration Test (excluding DB Webhook)...");

    try {
        // 1. Get initial worker stats
        console.log(`\n📊 Fetching initial worker stats...`);
        let initialStats;
        try {
            const healthRes = await axios.get(`${WORKER_URL}/health`);
            initialStats = healthRes.data.stats;
            console.log(`Initial Worker Stats: Processed: ${initialStats.processed}, Confirmed: ${initialStats.confirmed}, Failed: ${initialStats.failed}`);
        } catch (err) {
            console.error("❌ Failed to reach worker health check. Ensure worker is running.");
            process.exit(1);
        }

        // 2. Submit a booking request to the API Gateway
        console.log(`\n🎟️  Submitting booking request to API Gateway...`);
        const puid = `test_user_${Date.now()}`;
        const evtId = 'concert_integration_test';
        const seatIds = [`seat_IT_${Math.floor(Math.random() * 1000)}`];

        const payload = {
            userId: puid,
            eventId: evtId,
            seats: seatIds
        };

        const bookRes = await axios.post(`${GATEWAY_URL}/book-ticket`, payload);
        
        if (bookRes.status === 202) {
            console.log(`✅ API Gateway accepted the request! Waitlist ID: ${bookRes.data.waitlistId}`);
            console.log(`Accepted Seats:`, bookRes.data.acceptedSeats);
        } else {
            console.error(`❌ Unexpected status from API Gateway: ${bookRes.status}`);
            console.error(bookRes.data);
            process.exit(1);
        }

        // 3. Wait for the worker to process it. Worker has a 1-5s simulated payment delay.
        console.log(`\n⏳ Waiting 7 seconds to allow Worker to process the job...`);
        await delay(7000);

        // 4. Get updated worker stats
        console.log(`\n📊 Fetching final worker stats...`);
        const endHealthRes = await axios.get(`${WORKER_URL}/health`);
        const finalStats = endHealthRes.data.stats;
        console.log(`Final Worker Stats: Processed: ${finalStats.processed}, Confirmed: ${finalStats.confirmed}, Failed: ${finalStats.failed}`);

        // 5. Verify the flow (Gateway -> Orchestrator -> Redis -> Worker)
        const processedDelta = finalStats.processed - initialStats.processed;
        
        if (processedDelta >= seatIds.length) {
            console.log(`\n🎉 INTEGRATION TEST PASSED!`);
            console.log(`Successfully verified the pipeline: API Gateway -> Go Orchestrator -> Redis -> Node.js Worker.`);
            console.log(`(DB Webhook verification was intentionally excluded).`);
        } else {
            console.error(`\n❌ INTEGRATION TEST FAILED!`);
            console.error(`The worker did not seem to process the job. Worker processed count increased by ${processedDelta}, expected at least ${seatIds.length}.`);
            console.error(`Check your orchestrator, redis connection, and worker logs.`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`\n❌ Integration test encountered an error!`);
        if (error.response) {
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

runIntegrationTest();
