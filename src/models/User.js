const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");

const User=sequelize.define("User",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true
    },

    firsName:{
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

    role:{
        type:DataTypes.ENUM("user", "admin"),
        defaultValue:"user"
    }

}, {
    tableName:"users",
    timestamps:true
})

module.exports=User;
