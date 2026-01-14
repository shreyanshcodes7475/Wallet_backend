const {DataTypes}=require("sequelize")
const {sequelize}=require("../config/database");
const {Wallet} = require("./Wallet");

const Transaction=sequelize.define("Transaction",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true
    },

    //Transaction ID: 8f3b2c1e-91b2-4f8e-bb31-5a3d8a8f7b11
    referenceId:{
        type:DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        unique:true
    },

    amount:{
        type:DataTypes.DECIMAL(15,2),
        allowNull:false,
    },

    type:{
        type:DataTypes.ENUM("ADD", "TRANSFER"),
        allowNull:false
    },

    status:{
        type:DataTypes.ENUM("SUCCESS", "FAILED", "PENDING"),
        defaultValue:"PENDING"
    }
},{
    tableName:"transactions",
    timestamps:true,
})

// relations

Wallet.hasMany(Transaction,{foreignKey:"fromWalletId", as: "sentTransactions"});
Wallet.hasMany(Transaction,{foreignKey:"toWalletId", as:"receivedTransactions"});

Transaction.belongsTo(Wallet,{foreignKey:"fromWalletId", as:"fromWallet"});
Transaction.belongsTo(Wallet,{foreignKey:"toWalletId", as:"toWallet"});

module.exports={Transaction};