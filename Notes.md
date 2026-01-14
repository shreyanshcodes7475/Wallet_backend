## Description
The Secure Digital Wallet System allows users to securely add money, transfer funds to other users, and view transaction history. The system ensures atomic transactions, data consistency, authentication, authorization, and audit logging, similar to real-world banking systems.

Your system is:
A Digital Wallet & Transaction Engine

Its job is:

Identity
Authentication
Money movement
Audit
It is NOT a KYC / HR / profile system.

“I intentionally kept the user table minimal because sensitive KYC data like address or date of birth should be handled by a separate compliance system.”

## Core Functional Requirements
🔹 User Features

User registration & login (secure authentication)

Add money to wallet

Transfer money between users

View wallet balance

View transaction history (credit & debit)

Transaction status (SUCCESS / FAILED)

🔹 Admin / System Features

Audit logs for all transactions

Transaction rollback on failure

Prevent double-spending

Secure data storage

Error handling & alerts

## Non-Functional Requirements (Very Important for Evaluation)

Security: Encryption, hashed passwords, JWT

Consistency: ACID-compliant transactions

Reliability: Rollback on failure

Scalability: Supports multiple users

Auditability: Immutable transaction logs

Performance: Low-latency transfers

## High-Level Architecture

Client (Web / Mobile)
        |
     API Layer
        |
Authentication Service
        |
Transaction Service
        |
Database (Users, Wallets, Transactions, Audit Logs)



🏦 How Admin works in real banking systems

Admin is not a different system.
Admin is just a user with higher privileges.

| Table        | What admin sees    |
| ------------ | ------------------ |
| users        | All users          |
| wallets      | All balances       |
| transactions | All money movement |
| audit_logs   | All actions        |

Banks follow:

Single source of truth

All data lives in one system,
only access is restricted.

This prevents:

Duplicate records
Sync problems
Security gaps

“Admin is implemented as a role inside the users table. It uses the same database but has elevated permissions to view and manage transactions and audit logs.”



🧠 Why default = PENDING is actually CORRECT

When a transaction is created, at that moment:

Money is not yet moved

Gateway is not yet confirmed

DB operations not finished

So what is the truth at creation time?

👉 The transaction is PENDING

It is in “in-flight” state.


“IP address is stored when available, but it is not mandatory because many financial operations are performed by backend systems or payment gateways that don’t have an IP.”


## Autoincrement ek hi define hota ek model me

UUID = Universally Unique Identifier

It is a random, globally unique string used to identify something.

No one can guess:
How many transactions exist
What the next ID will be
This is security through randomness.

🔢 What is UUIDv4?

UUID has types (versions).
The most used is UUID version 4.

UUIDv4 = Randomly generated UUID
It uses random numbers from OS crypto engine.
So: DataTypes.UUIDV4


means:
Generate a cryptographically random unique ID.


🏦 Why we should NOT create token on signup

In real financial systems:

Signup ≠ Login

Identity creation ≠ Session creation

Banks always do:

“Account created. Please log in.”

They don’t auto-log you in because:

User might be unverified

Password was just set

Risk of session fixation

Security policy