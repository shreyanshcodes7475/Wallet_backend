const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");
const User = require("./User");
const Transaction=require("./Transaction")


const AuditLog=sequelize.define("AuditLog",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true,  
    },

    action:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    
    ipAddress:{
        type:DataTypes.STRING,
    }
},{
    tableName:"audit_logs",
    timestamps:true,
})

// Relations

User.hasMany(AuditLog,{foreignKey:"userId"});
AuditLog.belongsTo(User,{foreignKey:"userId"});

Transaction.hasMany(AuditLog,{foreignKey:"transactionId"});
AuditLog.belongsTo(Transaction,{foreignKey:"transactionId"});

module.exports=AuditLog;