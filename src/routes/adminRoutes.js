const express=require("express");
const{auth}=require("../middlewares/auth");
const {adminAuth}=require("../middlewares/adminAuth");
const { User, AuditLog } = require("../models");
const adminRouter=express.Router();
const bcrypt=require("bcrypt")



// admin signup api-
adminRouter.post("/create-admin",auth ,adminAuth,async(req,res)=>{
    try{
        const{email,firstName,lastName,password}=req.body;
        const existingUser=await User.findOne({
            where:{
                email:email,
            }
        })
        if(existingUser){
            return res.status(409).json({
                message:"email already registered"
            })
        }

        // hash password
        const passwordHash=await bcrypt.hash(password,10);

        // create admin
        const admin=await User.create({
            firstName,
            lastName,
            email,
            password:passwordHash,
            role:"admin"
        })

        // audit log who created admin
        await AuditLog.create({
            UserId:req.user.id,
            action:"ADMIN_CREATED",
            ipAddress:req.ip
        })

        res.status(201).json({
            message:"Admin created successfully",
            adminId:admin.id
        })

    }
    catch(err){
        res.status(400).json({
            message:"Admin registration failed",
            error:err.message
        })
    }
})



adminRouter.get("/ping",auth,adminAuth,(req,res)=>{
    res.json({
        message:"Admin access granted"
    })
})

module.exports={adminRouter};