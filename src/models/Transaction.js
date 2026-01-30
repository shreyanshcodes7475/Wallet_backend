const {DataTypes}=require("sequelize")
const {sequelize}=require("../config/database");
const { BIGINT } = require("sequelize");



const Transaction=sequelize.define("Transaction",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true
    },
    fromWalletId:{
        type:DataTypes.BIGINT,
        allowNull:false,
        references:{
            model:"wallets",
            key:"id"
        },
        onDelete:"RESTRICT",
        onUpdate:"CASCADE"
    },
    toWalletId:{
        type:DataTypes.BIGINT,
        allowNull:false,
        references:{
            model:"wallets",
            key:"id"
        },
        onDelete:"RESTRICT",
        onUpdate:"CASCADE"
    },

    paymentOrderId:{
        type:DataTypes.BIGINT,
        references:{
            model:"paymentorders",
            key:"id"
        }
    },

    gatewayOrderId:{
        type:DataTypes.STRING,
        allowNull:false
    },

    description:{
        type:DataTypes.STRING
    },

    metadata:{
        type:DataTypes.JSON
    },
    
    //Transaction ID: 8f3b2c1e-91b2-4f8e-bb31-5a3d8a8f7b11
    referenceId:{
        type:DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        unique:true
    },

    idempotencyKey:{
        type: DataTypes.STRING,
        unique:true,
        allowNull:false
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
        type:DataTypes.ENUM("CREATED", "PENDING", "PROCESSING", "SUCCESS", "FAILED", "REVERSED", "EXPIRED"),
        defaultValue:"CREATED"
    }
},{
    tableName:"transactions",
    timestamps:true,
})



module.exports={Transaction};