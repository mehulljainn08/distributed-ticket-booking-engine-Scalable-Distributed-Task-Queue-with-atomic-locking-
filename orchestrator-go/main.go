package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

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

	if result.(int64) == 0 {
		return fmt.Errorf("lock not found or unauthorized to release")
	}

	return nil
}

func main() {

	Addr := os.Getenv("REDIS_ADDR")
	Password := os.Getenv("REDIS_PASSWORD")
	if Addr == "" {
		Addr = "localhost:6379"
	}
	if Password == "" {
		Password = ""
	}
	client := redis.NewClient(&redis.Options{
		Addr:         Addr,
		Password:     Password,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
	})

	router := gin.Default()

	router.POST("/book", func(c *gin.Context) {
		var req BookingRequest

		err := c.ShouldBindJSON(&req)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx := c.Request.Context()

		lockAcquired := acquireLock(ctx, client, req.SeatID, req.UserID, req.EventID)

		if !lockAcquired {
			c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Seat %s for event %s is already booked", req.SeatID, req.EventID)})
			return
		}

		timeStamp := time.Now().Unix()
		req.Timestamp = timeStamp
		pushToQueue := enqueueBooking(ctx, client, req)
		if pushToQueue != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to enqueue booking request: %v", pushToQueue)})
			releaseLock(ctx, client, req.SeatID, req.UserID, req.EventID)
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

		ctx := c.Request.Context()

		err = releaseLock(ctx, client, req.SeatID, req.UserID, req.EventID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to release lock: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Booking request for seat %s for event %s released successfully", req.SeatID, req.EventID)})

	})

	port := os.Getenv("ORCHESTRATOR_PORT")

	if port == "" {
		port = "8080"
	}
	fmt.Println("Go Orchestrator running on http://localhost:" + port)
	router.Run(":" + port)

}
