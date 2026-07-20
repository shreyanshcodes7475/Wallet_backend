const express=require("express");
const authRouter=express.Router();
const {validateSignUpData}=require("../middlewares/validateSignUpData")
const bcrypt=require("bcrypt");
const { User, Wallet, AuditLog } = require("../models");
const {sequelize}=require("../config/database");
const { generateToken } = require("../utils/jwt");
const {auth} =require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimiter");
const validate=require("validator");


// signup api
authRouter.post("/signup",validateSignUpData,loginLimiter,async(req,res)=>{
    const { firstName, lastName, email, password,phoneNumber } = req.body;
    try{
        //check if user exists-
        const existingUser=await User.findOne({where:{email}});
        if(existingUser){
            return res.status(400).json({
                message:"Email already registered"
            })
        }
        
        // encryption of password
        if(validate.isStrongPassword(password)===false){
            return res.status(400).json({
                message:"Password should be strong. It must contain at least 8 characters, including uppercase, lowercase, number and symbol."
            })
        }

        const passwordHash=await bcrypt.hash(password,10);

        const user=await User.create({
            firstName,
            lastName,
            email,
            password:passwordHash,
            phoneNumber
        });

        await Wallet.create(
            {userId:user.id},
        )

        await AuditLog.create({
            userId:user.id,
            ipAddress:req.ip,
            action:"USER_CREATED",
        })


        res.status(201).json({
            message:"User Registered successfully",
            userId:user.id
        })
    }
    catch(err){
        res.status(500).json({
            message:"Signup failed",
            error:err.message
        })
    }
})

// Login apo
authRouter.post("/login",async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({
                message:"Both fields are required"
            })
        }

        const user=await User.findOne({where:{email}});
        if(!user){
        await AuditLog.create({
            userId:user.id,
            ipAddress:req.ip,
            action:"LOGIN_FAILED",
        },)
            return res.status(400).json({
                message:"Invalid Credentials"
            })
        }

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){

        await AuditLog.create({
            userId:user.id,
            ipAddress:req.ip,
            action:"LOGIN_FAILED",
        },)
            return res.status(400).json({
                message:"Invalid credentials"
            })
        }

        const token=generateToken(user);

        res.cookie("token",token,{
            httpOnly:true,
            sameSite:"Strict",
            expires:new Date(Date.now() + 8*60*60*1000)
        })

        await AuditLog.create({
            userId:user.id,
            ipAddress:req.ip,
            action:"LOGIN_SUCCESS",
        })

        const usersafeData={
            id:user.id,
            firstName:user.firstName,
            lastName:user.lastName,
            email:user.email,
            phoneNumber:user.phoneNumber,
            role:user.role, 
            failedPinAttempts: user.failedPinAttempts,
            walletLockedUntil: user.walletLockedUntil,
            kycStatus: user.kycStatus,
            riskScore: user.riskScore,
        }

        res.json({
            message:"Login Successful",
            user:usersafeData
        })

    }
    catch(err){
        res.status(500).json({
            message:"Login failed",
            error: err.message
        })

    }


})

// logout api
authRouter.post("/logout",async(req,res)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now())
    })
    res.send("Logout succesfully")
})


// update password api
authRouter.patch("/update-password",auth,async(req,res)=>{
    try{
        const {oldPassword,newPassword}=req.body;
        const user=req.user;
        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }

        if(!oldPassword || !newPassword){
            return res.status(400).json({
                message:"Both fields are required"
            })
        }

        if(oldPassword===newPassword){
            return res.status(400).json({
                message:"New password cannot be same as old password"
            })
        }

        if(validate.isStrongPassword(newPassword)===false){
            return res.status(400).json({
                message:"Password should be strong. It must contain at least 8 characters, including uppercase, lowercase, number and symbol."
            })
        }

        const isMatch=await bcrypt.compare(oldPassword,user.password);
        if(!isMatch){
            return res.status(400).json({
                message:"Old password is incorrect"
            })
        }



        const newPasswordHash=await bcrypt.hash(newPassword,10);
        user.password=newPasswordHash;
        await user.save();
        res.json({
            message:"Password updated successfully"
        })  
    }
    catch(err){
        res.status(500).json({
            message:"Failed to update password",
            error:err.message
        })
    }
})

// profile api
authRouter.get("/profile",auth,async(req,res)=>{
    try{
        const user=await User.findByPk(req.user.id);
        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }
        const usersafeData={
            id:user.id,
            firstName:user.firstName,
            lastName:user.lastName,
            email:user.email,
            phoneNumber:user.phoneNumber,
            role:user.role, 
            failedPinAttempts: user.failedPinAttempts,
            walletLockedUntil: user.walletLockedUntil,
            kycStatus: user.kycStatus,
            riskScore: user.riskScore,
        }
        res.json({
            success:true,
            user: usersafeData
            
        })
    }
    catch(err){
        res.status(500).json({
            message:"Failed to fetch profile",
            error:err.message
        })
    }
})

// auth test api
authRouter.get("/protected",auth,(req,res)=>{
    res.json({
        message:"You are logged in",
        user:req.user
    })
})


module.exports={authRouter};