const express=require("express");
const { validate } = require("uuid");
const authRouter=express.Router();
const {validateSignUpData}=require("../middlewares/validateSignUpData")
const bcrypt=require("bcrypt");
const { User, Wallet } = require("../models");
const {sequelize}=require("../config/database");
const { generateToken } = require("../utils/jwt");
const {auth} =require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimiter");


// signup api
authRouter.post("/signup",validateSignUpData,loginLimiter,async(req,res)=>{
    const t=await sequelize.transaction();
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
        },{transaction:t});

        await Wallet.create(
            {userId:user.id},
            {transaction:t}
        )

        await t.commit();

        res.status(201).json({
            message:"User Registered successfully",
            userId:user.id
        })
    }
    catch(err){
        await t.rollback();
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
            return res.status(400).json({
                message:"Invalid Credentials"
            })
        }

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
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
        user:req.user.email
    })
})


module.exports={authRouter};