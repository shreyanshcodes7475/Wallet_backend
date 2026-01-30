const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");

const User=sequelize.define("User",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true
    },

    firstName:{
        type:DataTypes.STRING,
        allowNull:false
    },

    lastName:{
        type:DataTypes.STRING,
        allowNull:false
    },

    email:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false
    },

    password:{
        type:DataTypes.STRING,
        allowNull:false
    },
    phoneNumber:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false,
    },
    walletPin:{
        type:DataTypes.STRING, //hashed
        allowNull:true

    },
    walletPinSet:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    
    failedPinAttempts:{
        type:DataTypes.INTEGER,
        defaultValue:0
    },

    walletLockedUntil:{
        type:DataTypes.DATE
    },

    kycStatus:{
        type:DataTypes.ENUM('PENDING','VERIFIED','REJECTED'),
        defaultValue:"PENDING",
        allowNull:false
    },

    riskScore:{
        type:DataTypes.INTEGER,
        defaultValue:0
    },

    role:{
        type:DataTypes.ENUM("user", "admin"),
        defaultValue:"user"
    }

}, {
    tableName:"users",
    timestamps:true
})

module.exports={User};
