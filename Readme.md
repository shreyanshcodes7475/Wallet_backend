## dependencies--
express sequelize mysql2 dotenv bcrypt jsonwebtoken uuid


## core modules

1. User Authentication
    signup/login
    jwt based auth
    password hashing

2. wallet system (core)
    only 1 wallet will be assign to each user
    wallet fields:
       - balance
       - walletid
       - status(active/blocked)

3. Add money
        - payment through razorpay
        - sucess ke baad
            - wallet balance increase
            - transaction entry create

4. Transfer money
    A-->B









-----------------------------------------------
## database tables

1. user
| Field     | Purpose          |
| --------- | ---------------- |
| id        | User ID          |
| name      | User name        |
| email     | Login            |
| password  | Hashed password  |
| role      | user / admin     |
| createdAt | When user joined |

2. wallets
| Field     | Purpose          |
| --------- | ---------------- |
| id        | Wallet ID        |
| userId    | Owner            |
| balance   | Current money    |
| status    | active / blocked |
| createdAt | Wallet creation  |

3. transaction

Transaction ID: 8f3b2c1e-91b2-4f8e-bb31-5a3d8a8f7b11

What DB uses internally: id = 12451
UUID is used instead of autoIncrement

Impossible to guess
Impossible to predict
Safe to show publicly

This prevents:

transaction enumeration
fraud
data leaks



| Field        | Purpose               |
| ------------ | --------------------- |
| id           | Internal ID           |
| referenceId  | Public transaction ID |
| fromWalletId | Sender                |
| toWalletId   | Receiver              |
| amount       | Money                 |
| type         | ADD / TRANSFER        |
| status       | SUCCESS / FAILED      |
| createdAt    | Time                  |


4. audits_logs

| Field       | Purpose           |
| ----------- | ----------------- |
| id          | Log ID            |
| userId      | Who did it        |
| action      | What happened     |
| referenceId | Which transaction |
| ipAddress   | From where        |
| createdAt   | Time              |






















## APIS List
| Method | API                | Purpose       |
| ------ | ------------------ | ------------- |
| POST   | `/api/auth/signup` | Register user |
| POST   | `/api/auth/login`  | Login         |


| Method | API                        | Purpose              |
| ------ | -------------------------- | -------------------- |
| GET    | `/api/wallet`              | Get my wallet        |
| POST   | `/api/wallet/add-money`    | Add money (Razorpay) |
| POST   | `/api/wallet/transfer`     | Send money           |
| GET    | `/api/wallet/transactions` | My history           |


| Method | API                       | Purpose          |
| ------ | ------------------------- | ---------------- |
| GET    | `/api/admin/transactions` | All transactions |
| GET    | `/api/admin/audit-logs`   | All logs         |
| POST   | `/api/admin/block-user`   | Block fraud user |






🏦 What Transfer Money MUST guarantee (bank rules)

When User A sends money to User B:

✅ No double spending
✅ Balance never goes negative
✅ Sender & receiver update together
✅ One failure → everything rollback
✅ Full audit trail

That’s why we need:

DB transaction (t)
Row locking
Transaction + AuditLog entries

## FLOW
    1. start a session
    2. lock sender wallet
    3. lock receriver wallet
    4.checck balnace
    5. deduct sedner
    6. credit receiver\
    7. create audit log
    8. commit