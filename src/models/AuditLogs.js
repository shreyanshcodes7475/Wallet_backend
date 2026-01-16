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
    
    ipAddress:{
        type:DataTypes.STRING,
    }
},{
    tableName:"audit_logs",
    timestamps:true,
})


module.exports={AuditLog};