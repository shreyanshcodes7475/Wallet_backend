const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");



const AuditLog=sequelize.define("AuditLog",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true,  
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
    transactionId:{
        type:DataTypes.BIGINT,
        references:{
            model:"transactions",
            key:"id"
        },
    
        onUpdate:"CASCADE",
        onDelete:"RESTRICT"
    },

    action:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    entityType:{
        type:DataTypes.STRING
    },

    entityId:{
        type:DataTypes.BIGINT
    },

    beforeState:{
        type:DataTypes.JSON
    },
    afterState:{
        type:DataTypes.JSON
    },

    deviceInfo:{
        type:DataTypes.JSON
    },
    
    ipAddress:{
        type:DataTypes.STRING,
    }
},{
    tableName:"audit_logs",
    timestamps:true,
})


module.exports={AuditLog};