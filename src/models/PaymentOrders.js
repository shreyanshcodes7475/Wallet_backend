const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database")

const PaymentOrder=sequelize.define("PaymentOrder",{
    id:{
        type:DataTypes.BIGINT,
        primaryKey:true,
        autoIncrement:true
    },

    userId:{
        type:DataTypes.BIGINT,
        allowNull:false,
        references:{
            model:"users",
            key:"id"
        },
        onDelete:"RESTRICT",
        onUpdate:"CASCADE"
    },

    amount:{
        type:DataTypes.DECIMAL(15,2),
        allowNull:false
    },

    status:{
        type:DataTypes.ENUM('CREATED','PENDING', 'FAILED',"SUCCESS", 'EXPIRED'),
        defaultValue:"CREATED"
    },

    clientRequestId:{
        type:DataTypes.STRING(100),
        unique:true,
        allowNull:false

    },

    gatewayOrderId:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false
    },

    paymentMethod:{
        type:DataTypes.STRING,
    },
    signatureVerified:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    }
    
},{
    tableName:"paymentorders",
    timestamps:true
}
)

module.exports={PaymentOrder}