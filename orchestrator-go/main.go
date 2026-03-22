package main

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {

	ctx := context.Background()

	client := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	status, err := client.Ping(ctx).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(status)

}
