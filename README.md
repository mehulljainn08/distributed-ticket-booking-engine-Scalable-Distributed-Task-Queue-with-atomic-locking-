# 🎟️ Distributed Ticket Booking Engine  
*A Scalable, Event-Driven Microservices System for High-Concurrency Seat Booking*

A production-inspired distributed system designed to handle massive concurrent booking requests (e.g., IRCTC Tatkal, BookMyShow flash sales) without race conditions or double bookings.

Built using **Go, Node.js, Redis, Postgres, and Docker**.

---

## 🧠 Problem Statement

In high-demand ticketing systems, thousands of users may attempt to book the same seat at the exact same time.

A traditional synchronous API approach can lead to:
- ❌ Race conditions  
- ❌ Double bookings  
- ❌ Payment inconsistencies  

---

## 💡 Solution Overview

This system decouples **request ingestion** from **execution** using an asynchronous, queue-based architecture.

### Key Idea:
- Users enter a **virtual waiting queue**
- Background workers process requests asynchronously
- **Redis atomic locking (`SETNX`)** ensures only one user secures a seat

---

## 🏗️ Architecture Overview

The system is composed of **5 independent microservices**:

### 1. API Gateway (Node.js / Express)
- Entry point for all booking requests
- Generates a **Waitlist ID**
- Pushes requests to Redis queue
- Responds immediately with **HTTP 202 (Accepted)**

---

### 2. Task Orchestrator & Broker (Go)
- Manages the Redis queue
- Implements **atomic seat locking using `SETNX`**
- Monitors worker health (heartbeat-based)
- Handles failure recovery and task re-queuing

---

### 3. Worker Nodes (Node.js)
- Horizontally scalable workers
- Continuously fetch tasks from queue
- Attempt to acquire seat lock
- Process booking & simulate payment

---

### 4. Database & Webhook Service (Node.js + Postgres)
- Stores final booking results
- Handles success/failure states
- Sends webhook events back to clients

---

### 5. Frontend (React / HTML)
- Displays real-time seat availability
- Updates booking status dynamically via webhook events

---

## 🚀 Key Distributed Systems Concepts

### 🔹 Asynchronous Decoupling
- API responds instantly (HTTP 202)
- Prevents server overload under heavy traffic

---

### 🔹 Atomic Locking (Redis `SETNX`)
- Guarantees **exactly-once seat allocation**
- Prevents race conditions across distributed workers

---

### 🔹 Work Stealing (Load Balancing)
- Workers pull tasks independently
- Ensures efficient utilization and natural load balancing

---

### 🔹 Fault Tolerance
- Orchestrator detects worker failures
- Re-queues unfinished tasks (Poison Pill handling)

---

### 🔹 Event-Driven Communication
- Webhooks notify clients instantly
- Eliminates inefficient polling

---

## ⚙️ Tech Stack

| Layer            | Technology       |
|------------------|------------------|
| API Layer        | Node.js, Express |
| Orchestration    | Go               |
| Queue & Locking  | Redis            |
| Workers          | Node.js          |
| Database         | Postgres         |
| Containerization | Docker           |

---

## 🛠️ Local Development Setup

### 1. Clone the Repository
```bash
https://github.com/mehulljainn08/distributed-ticket-booking-engine-Scalable-Distributed-Task-Queue-with-atomic-locking-
cd distributed-ticket-booking-engine

### 2. Start Infrastructure (Redis + MongoDB)
docker-compose up -d

