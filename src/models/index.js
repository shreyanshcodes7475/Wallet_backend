const { sequelize } = require("../config/database");
const { User } = require("./User");
const { Wallet } = require("./Wallet");
const { Transaction } = require("./Transaction");
const { AuditLog } = require("./AuditLogs");
const { Ledger } = require("./Ledger");
const { PaymentOrder } = require("./PaymentOrders");
const {RiskEvent}=require("./RiskEvent")

// User ↔ Wallet
User.hasOne(Wallet,{foreignKey:"userId"});
Wallet.belongsTo(User, { foreignKey: "userId" });

// user and paymentorder
User.hasMany(PaymentOrder,{foreignKey:"userId"});
PaymentOrder.belongsTo(User,{foreignKey: "userId"})


// user and risk event
User.hasMany(RiskEvent, { foreignKey: "userId" });
RiskEvent.belongsTo(User, { foreignKey: "userId" });

// Wallet ↔ Transactions
Wallet.hasMany(Transaction, {
  foreignKey: "fromWalletId",
  as: "sentTransactions"
});

Wallet.hasMany(Transaction, {
  foreignKey: "toWalletId",
  as: "receivedTransactions"
});

Transaction.belongsTo(Wallet, {
  foreignKey: "fromWalletId",
  as: "sender"
});

Transaction.belongsTo(Wallet, {
  foreignKey: "toWalletId",
  as: "receiver"
});

// Transaction- risk event
Transaction.hasMany(RiskEvent, { foreignKey: "transactionId" });
RiskEvent.belongsTo(Transaction, { foreignKey: "transactionId" });

// Transaction -ledger
Transaction.hasMany(Ledger,{foreignKey: "transactionId"});
Ledger.belongsTo(Transaction,{foreignKey: "transactionId"});


// User ↔ AuditLog  
User.hasMany(AuditLog, { foreignKey: "userId" });
AuditLog.belongsTo(User, { foreignKey: "userId" });

// Transaction ↔ AuditLog
Transaction.hasMany(AuditLog, { foreignKey: "transactionId" });
AuditLog.belongsTo(Transaction, { foreignKey: "transactionId" });

module.exports = {
  User,
  Wallet,
  Transaction,
  AuditLog,
  PaymentOrder,
  RiskEvent,
  Ledger,
  sequelize
};
