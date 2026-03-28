package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func init() {
	envPath := filepath.Join("..", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("warning: could not load %s: %v", envPath, err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

type BookingRequest struct {
	UserID    string `json:"user_id"`
	SeatID    string `json:"seat_id"`
	EventID   string `json:"event_id"`
	Timestamp int64  `json:"timestamp"`
}

func acquireLock(ctx context.Context, client *redis.Client, seatID string, userID string, eventID string) bool {
	key := "lock:event:" + eventID + ":seat:" + seatID
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

func releaseLock(ctx context.Context, client *redis.Client, seatID string, userID string, eventID string) error {
	key := "lock:event:" + eventID + ":seat:" + seatID

	script := `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
    `

	result, err := client.Eval(ctx, script, []string{key}, userID).Result()
	if err != nil {
		return err
	}

	// If result is 0, the lock didn't exist or belonged to someone else
	if result.(int64) == 0 {
		return fmt.Errorf("lock not found or unauthorized to release")
	}

	return nil
}

func main() {

	client := redis.NewClient(&redis.Options{
		Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
		Password: getEnv("REDIS_PASSWORD", ""),
	})

	router := gin.Default()

	router.POST("/book", func(c *gin.Context) {
		var req BookingRequest

		err := c.ShouldBindJSON(&req)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx := context.Background()

		lockAcquired := acquireLock(ctx, client, req.SeatID, req.UserID, req.EventID)

		if !lockAcquired {
			c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Seat %s for event %s is already booked", req.SeatID, req.EventID)})
			return
		}

		timeStamp := time.Now().Unix()
		req.Timestamp = timeStamp
		pushToqueue := enqueueBooking(ctx, client, req)
		if pushToqueue != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to enqueue booking request: %v", pushToqueue)})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Booking request for seat %s for event %s enqueued successfully", req.SeatID, req.EventID)})

	})

	router.POST("/release", func(c *gin.Context) {
		var req BookingRequest

		err := c.ShouldBindJSON(&req)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx := context.Background()

		err = releaseLock(ctx, client, req.SeatID, req.UserID, req.EventID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to release lock: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Booking request for seat %s for event %s released successfully", req.SeatID, req.EventID)})

	})

	port := getEnv("ORCHESTRATOR_PORT", "8080")
	fmt.Println("Go Orchestrator running on http://localhost:" + port)
	router.Run(":" + port)

}
