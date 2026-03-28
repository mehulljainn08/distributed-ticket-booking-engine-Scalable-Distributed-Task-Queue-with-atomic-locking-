package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type BookingRequest struct {
	UserID    string `json:"user_id"`
	SeatID    string `json:"seat_id"`
	EventID   string `json:"event_id"`
	Timestamp int64  `json:"timestamp"`
}

const (
	baseURL = "http://localhost:8080"
	vus     = 50 // Virtual Users
	iters   = 20 // Iterations per VU
)

func main() {
	var wg sync.WaitGroup
	var successCount, conflictCount, errorCount int64
	var mu sync.Mutex

	fmt.Printf("🚀 Starting Load Test with %d VUs and %d Iterations per VU...\n", vus, iters)
	start := time.Now()

	for i := 0; i < vus; i++ {
		wg.Add(1)
		go func(vuID int) {
			defer wg.Done()
			for j := 0; j < iters; j++ {
				// ── Scenario: Contention on seat_VIP_01 ──
				userID := fmt.Sprintf("vu_%d_user_%d", vuID, j)
                
				// ── Try to Book ──
				status := attemptBook(userID, "seat_VIP_01", "concert_2026")

				mu.Lock()
				switch status {
				case 200:
					successCount++
				case 409:
					conflictCount++
				default:
					errorCount++
				}
				mu.Unlock()

				// If successful, short wait then release
				if status == 200 {
					time.Sleep(100 * time.Millisecond)
					attemptRelease(userID, "seat_VIP_01", "concert_2026")
				}
			}
		}(i)
	}

	wg.Wait()
	duration := time.Since(start)

	fmt.Println("\n📊 Performance Results:")
	fmt.Printf("  ✅ Successful Bookings: %d\n", successCount)
	fmt.Printf("  🥊 Conflicts (Already Booked): %d\n", conflictCount)
	fmt.Printf("  ❌ Errors: %d\n", errorCount)
	fmt.Printf("  ⏱️ Total Duration: %v\n", duration)
	fmt.Printf("  ⚡ Requests Per Second: %.2f req/s\n", float64(vus*iters)/duration.Seconds())
}

func attemptBook(userID, seatID, eventID string) int {
	reqBody, _ := json.Marshal(BookingRequest{
		UserID:  userID,
		SeatID:  seatID,
		EventID: eventID,
	})

	resp, err := http.Post(baseURL+"/book", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		fmt.Printf("error: %v\n", err)
		return 500
	}
	defer resp.Body.Close()
	return resp.StatusCode
}

func attemptRelease(userID, seatID, eventID string) int {
	reqBody, _ := json.Marshal(BookingRequest{
		UserID:  userID,
		SeatID:  seatID,
		EventID: eventID,
	})

	resp, err := http.Post(baseURL+"/release", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return 500
	}
	defer resp.Body.Close()
	return resp.StatusCode
}
