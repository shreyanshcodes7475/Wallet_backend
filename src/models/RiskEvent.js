const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database")

const RiskEvent = sequelize.define("RiskEvent", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },

  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: "users", key: "id" }
  },

  transactionId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: { model: "transactions", key: "id" }
  },

  ruleTriggered: {
    type: DataTypes.STRING,
    allowNull: false
  },

  riskPoints: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  actionTaken: {
    type: DataTypes.ENUM("ALLOW", "REVIEW", "BLOCK"),
    defaultValue: "ALLOW"
  }

}, {
  tableName: "risk_events",
  timestamps: true
});


module.exports={RiskEvent}