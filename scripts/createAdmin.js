require("dotenv").config();
const {sequelize}=require("../src/config/database");
const { User } = require("../src/models");
const bcrypt=require("bcrypt");


(async()=>{
    try{
        await sequelize.authenticate();
        
        const existingAdmin=await User.findOne({
            where:{ role:"admin"}
        })

        if(existingAdmin){
            console.log("Admin already exist");
            process.exit(0);
        }

        const passwordHash=await  bcrypt.hash("Admin@123$",10);

        const admin=await User.create({
            firstName:"Super",
            lastName:"Admin",
            email:"admin@vaultpay.com",
            password:passwordHash,
            phoneNumber:"0000000000",
            role:"admin"
        })

        await admin.save();
        
        console.log("Admin created :", admin.email);
        await sequelize.close();
        process.exit(0);

    }
    catch(err){
        console.error("Error creating admin:", err);
        await sequelize.close();
        process.exit(1);
    }
})();
