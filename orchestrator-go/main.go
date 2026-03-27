package main

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type BookingRequest struct {
	UserID    string `json:"user_id"`
	SeatID    string `json:"seat_id"`
	EventID   string `json:"event_id"`
	Timestamp int64  `json:"timestamp"`
}

func acquireLock(ctx context.Context, client *redis.Client, seatID string, userID string) bool {
	key := "lock:seat:" + seatID
	success, err := client.SetNX(ctx, key, userID, 10*time.Second).Result()
	if err != nil {
		fmt.Println("Error acquiring lock:", err)
		return false
	}

	return success

}

func enqueueBooking(ctx context.Context, client *redis.Client, req BookingRequest) error {

	jsonData, err := json.Marshal(req)

	if err != nil {
		return fmt.Errorf("failed to marshal booking request: %v", err)
	}
	err = client.RPush(ctx, "queue:pending_bookings", jsonData).Err()
	if err != nil {
		return fmt.Errorf("failed to enqueue booking request: %v", err)
	}
	return nil
}
func main() {
	ctx := context.Background()
	client := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	var wg sync.WaitGroup

	targetSeat := "A1"
	eventID := "event_123"

	fmt.Println(" Starting Flash Sale Simulation...")
	wg.Add(5)
	for i := 1; i <= 5; i++ {

		id := fmt.Sprintf("user_%d", i)

		go func(uID string) {

			defer wg.Done()
			if acquireLock(ctx, client, targetSeat, uID) {
				fmt.Printf("[SUCCESS] %s got the lock for %s\n", uID, targetSeat)

				req := BookingRequest{
					UserID:    uID,
					SeatID:    targetSeat,
					EventID:   eventID,
					Timestamp: time.Now().Unix(),
				}

				if err := enqueueBooking(ctx, client, req); err != nil {
					fmt.Printf("[ERROR] %s failed to queue: %v\n", uID, err)
				} else {
					fmt.Printf("[QUEUED] %s is in the line for %s\n", uID, targetSeat)
				}
			} else {
				fmt.Printf("[REJECTED] %s - Seat %s already taken\n", uID, targetSeat)
			}

		}(id)

	}

	wg.Wait()
	fmt.Println("Simulation Complete.")
}
