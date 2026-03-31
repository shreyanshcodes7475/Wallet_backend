const express=require("express");
const { validate } = require("uuid");
const authRouter=express.Router();
const {validateSignUpData}=require("../middlewares/validateSignUpData")
const bcrypt=require("bcrypt");
const { User, Wallet, AuditLog } = require("../models");
const {sequelize}=require("../config/database");
const { generateToken } = require("../utils/jwt");
const {auth} =require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimiter");


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

        res.json({
            message:"Login Successful",
            user:user
        })

    }
    catch(err){
        res.status(400).json({
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

// auth test api
authRouter.get("/protected",auth,(req,res)=>{
    res.json({
        message:"You are logged in",
        user:req.user
    })
})


module.exports={authRouter};