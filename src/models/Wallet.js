const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");
const { FOREIGNKEYS } = require("sequelize/lib/query-types");

const Wallet=sequelize.define("Wallet",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true
        
    },

    userId:{
        type:DataTypes.BIGINT,
        references:{
            model:"users",
            key:"id"
        },
        onDelete:"cascade",
        onUpdate:"cascade"

    },
    balance:{
        type:DataTypes.DECIMAL(15,2),
        defaultValue:0.00
    },
    
    availableBalance:{
        type:DataTypes.DECIMAL(15,2),
        defaultValue:0.00
    },

    heldBalance:{
        type:DataTypes.DECIMAL(15,2),
        defaultValue:0.00
    },
    currency:{
        type:DataTypes.STRING,
        defaultValue:"INR"
    },

    type:{
        type:DataTypes.ENUM("USER", "SYSTEM","ESCROW"),
        defaultValue:"USER"
        
    },

    lockedUntil:{
        type:DataTypes.DATE
    },
    status:{
        type:DataTypes.ENUM("active", "blocked"),
        defaultValue:"active"
    }
},
{
    tableName:"wallets",
    timestamps:true
})



module.exports={Wallet};