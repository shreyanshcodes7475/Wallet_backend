const {DataTypes}=require("sequelize");
const {sequelize}=require("../config/database");
const {User}=require("./User");
const { FOREIGNKEYS } = require("sequelize/lib/query-types");

const Wallet=sequelize.define("Wallet",{
    id:{
        type:DataTypes.BIGINT,
        autoIncrement:true,
        primaryKey:true
        
    },
    balance:{
        type:DataTypes.DECIMAL(15,2),
        defaultValue:0.00
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

// Relations
User.hasOne(Wallet,{foreignKey:"userId"});
Wallet.belongsTo(User,{foreignKey:"userId"});

module.exports={Wallet};