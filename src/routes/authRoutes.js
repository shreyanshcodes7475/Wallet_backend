const express=require("express");
const { validate } = require("uuid");
const authrouter=express.Router();
const {validateSignUpData}=require("../middlewares/validateSignUpData")
const bcrypt=require("bcrypt");
const { User } = require("../models/User");
const {Wallet}=require("../models/Wallet")
const {sequelize}=require("../config/database");
const { generateToken } = require("../utils/jwt");
const {auth} =require("../middlewares/auth")


// signup api
authrouter.post("/signup",validateSignUpData,async(req,res)=>{
    const t=await sequelize.transaction();
    const { firstName, lastName, email, password } = req.body;
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
            password:passwordHash
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
authrouter.post("/login",async(req,res)=>{
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

// auth test api
authrouter.get("/protected",auth,(req,res)=>{
    res.json({
        message:"You are logged in",
        user:req.user.email
    })
})


module.exports={authrouter};