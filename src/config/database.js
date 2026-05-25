const {Sequelize} =require("sequelize");

const sequelize=new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host:process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect:"mysql",
        logging:false,
    }

);

const connectDB=async()=>{
    try{
        await sequelize.authenticate();
        console.log("vaultpay DB connected succesfully");

    }
    catch(err){
        console.log("DB connection failed: "+ err)
    }
};

module.exports={connectDB,sequelize};