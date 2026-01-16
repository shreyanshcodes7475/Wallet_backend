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


💰 Transaction table = Money movement

This stores:

“What happened to money?”
📜 Audit Log = System activity log

This stores:“Who did what, from where, and when?”


🧠 Think in real-world terms
One Transaction (₹500 transfer) can generate multiple logs:

TRANSFER_INITIATED
BALANCE_DEBITED
BALANCE_CREDITED
TRANSFER_SUCCESS

So : 1 transaction → many audit logs
But:
1 audit log → only 1 transaction

So in database terms: Transaction 1 ─────< AuditLog
Transaction.hasMany(AuditLog, { foreignKey: "transactionId" });
AuditLog.belongsTo(Transaction, { foreignKey: "transactionId" });

audit_logs.transactionId stores which transaction this log belongs to
One transaction can have many audit rows


🧠 Node.js ka module resolution rule

Jab tu likhta hai: require("../models")


Node internally yeh steps follow karta hai:

1️⃣ Check karta hai: ../models.js


Agar nahi mila →
2️⃣ Check karta hai: ../models.json


Agar nahi mila →
3️⃣ Check karta hai: ../models/index.js   👈 THIS
Agar ye mil gaya → Node use load kar leta hai.
“Node automatically loads index.js when requiring a folder.”



## v.v.v.vimp const t = await sequelize.transaction();
ACID properties
t ensures A + C
“I use database transactions to guarantee atomicity in money operations.”
“Next kuch queries ko ek bundle me treat karo.”
Ya to sab succeed
Ya sab rollback

if(err) await t.rollback();
if(!err) await t.commit();


what about 
t.LOCK.UPDATE:  “Is wallet ko abhi koi aur touch nahi karega jab tak main kaam finish na kar loon.”
MySQL bolta hai:
“Is row pe exclusive lock laga do”
Dusra request wait karega
Jab pehla commit karega → tab next chalega





🏦 Real-world meaning

Soch: User ₹500 add kar raha hai

Isme 4 cheezein hoti hain:

Wallet balance badhta
Transaction record banta
Audit log banta
System success mark karta

Agar beech me koi fail ho gaya: sab kuch wapas hona chahiye

Bank kabhi nahi bolega: “Balance badh gaya but transaction record nahi bana” ❌