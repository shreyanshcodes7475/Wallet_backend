const DataTypes=require("sequelize")
const {sequelize}=require("../config/database")

const Ledger=sequelize.define("Ledger",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true,
    },
    transactionId:{
        type:DataTypes.BIGINT,
        allowNull:false,
        references:{
            model:"transactions",
            key:"id"
        },

        onUpdate:"CASCADE",
        onDelete:"RESTRICT"

    },
    debitwalletId:{
        type:DataTypes.BIGINT,
        allowNull:false,
        references:{
            model:"wallets",
            key:"id"
        },
        onDelete:"RESTRICT",
        onUpdate:"CASCADE"
    },
    creditAccountId:{
        type:DataTypes.BIGINT,
        allowNull:false,
        references:{
            model:"wallets",
            key:"id"
        },
        onDelete:"RESTRICT",
        onUpdate:"CASCADE"
    },
    amount:{
        type:DataTypes.DECIMAL(15,2),
        allowNull:false
    },
    type:{
        type:DataTypes.ENUM("TRANSFER","DEPOSIT","REFUND","FEE")
    }
},{
    tableName:"ledgers",
    timestamps:true
})

module.exports={Ledger}