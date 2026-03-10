# 🏦 VaultPay – Secure Wallet & Transaction System (Backend)

A **banking-grade wallet system backend** built with Node.js, Express, MySQL, and Sequelize, focusing on **transaction safety, idempotency, auditability, and admin controls**.

---

## 🚀 Features

### 👤 User Features

* User signup & login (JWT-based authentication)
* Automatic wallet creation
* View wallet balance
* Secure money transfer
* Transaction history with pagination & filters
* Retry-safe transfers using **Idempotency Keys**

### 🛡️ Security & Reliability

* Row-level locking (`FOR UPDATE`) to prevent race conditions
* Atomic DB transactions with rollback
* Idempotency to prevent double spending
* Rate limiting on sensitive APIs
* Secure password hashing (bcrypt)
* HTTP-only cookies for JWT

### 👨‍💼 Admin Features

* Admin authentication & role-based access
* View all transactions with filters (type, status, pagination)
* Advanced audit logs (who did what, when, from where)
* Admin dashboard with system KPIs:

  * Total users
  * Total wallets
  * Total transactions
  * Total transaction volume
  * Failed transactions
  * Today’s transaction stats
  * Today's user stats

---

## 🧠 System Design Principles

* **Exactly-once execution** for financial operations
* **Separation of concerns** (controllers, routes, models, middleware)
* **Audit-first design** for compliance & traceability
* **Database as source of truth**

---

## 🏗️ Architecture Overview

```
Client
  |
  |  HTTP (JWT + Idempotency-Key)
  v
API Layer (Express)
  |
  |-- Auth Middleware (JWT)
  |-- Admin Auth Middleware
  |-- Rate Limiter
  |
Service Layer
  |
  |-- Wallet Logic
  |-- Transfer Logic
  |-- Admin Analytics
  |
Database (MySQL)
  |
  |-- Users
  |-- Wallets
  |-- Transactions
  |-- AuditLogs
```

---

## 🗄️ Database Schema (Simplified)

### User

* id
* firstName
* lastName
* email (unique)
* password (hashed)
* role (user/admin)

### Wallet

* id
* userId (FK)
* balance

### Transaction

* id
* referenceId (UUID)
* amount
* type (ADD / TRANSFER)
* status (SUCCESS / FAILED / PENDING)
* fromWalletId
* toWalletId
* idempotencyKey (unique per wallet)

### AuditLog

* id
* userId
* transactionId (nullable)
* action
* ipAddress
* createdAt

---

## 🔁 Money Transfer Flow (High Level)

```
1. Validate request (no DB)
2. Start DB transaction
3. Lock sender wallet
4. Check idempotency key
5. Validate balance
6. Lock receiver wallet
7. Update balances
8. Create transaction record
9. Create audit logs
10. Commit transaction
```

---

## 🔑 Idempotency (Banking-Grade)

* Client sends a unique `idempotencyKey` for each transfer
* Same key retried → same response returned
* Prevents double spending during retries or network failures

---

## 📊 Admin Dashboard Metrics

* Total users
* Total wallets
* Total transactions
* Total transaction volume
* Failed transactions
* Today’s transactions & volume
* admin  users filter:
  -- kyc status filter
  -- wallet status filter
  -- Search Filter (email / phone)


---

## 🧪 Tech Stack

* **Backend:** Node.js, Express
* **Database:** MySQL
* **ORM:** Sequelize
* **Auth:** JWT, bcrypt
* **Security:** Rate limiting, HTTP-only cookies
* **Logging:** Audit logs
* **Other:** dotenv
## dependencies--
express sequelize mysql2 dotenv bcrypt jsonwebtoken uuid expressratelimit


## 🏦 Why This Project Stands Out

* Designed like a **real banking system**
* Focus on **correctness over UI**
* Handles concurrency, retries, and failures
* Admin & audit features inspired by fintech companies

---

## 📌 Interview Talking Points

* “Implemented idempotency to ensure retry-safe financial operations”
* “Used row-level locking to prevent race conditions”
* “Audit logs are immutable and compliance-ready”
* “Dashboard APIs use aggregated queries for performance”

---

## 📈 Future Improvements

* Payment gateway integration (Razorpay)
* Cursor-based pagination
* Notifications & alerts
* Distributed locks (Redis)



## 🧑‍🎓 Author

**Shreyansh Gupta**
Third Year B.E IT
Backend / Fintech Enthusiast


