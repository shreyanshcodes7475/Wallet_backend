const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");



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
    entityType:{
        type:DataTypes.STRING
    },

    entityID:{
        type:DataTypes.BIGINT
    },

    beforeState:{
        type:DataTypes.JSON
    },
    afterState:{
        type:DataTypes.JSON
    },

    deviceInfo:{
        type:DataTypes.STRING
    },
    
    ipAddress:{
        type:DataTypes.STRING,
    }
},{
    tableName:"audit_logs",
    timestamps:true,
})


module.exports={AuditLog};