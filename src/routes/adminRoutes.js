const express=require("express");
const{auth}=require("../middlewares/auth");
const {adminAuth}=require("../middlewares/adminAuth");
const { User, AuditLog, Transaction } = require("../models");
const {Wallet}=require("../models")
const adminRouter=express.Router();
const bcrypt=require("bcrypt");
const { Op,fn,col } = require("sequelize");
const { NUMBER } = require("sequelize");



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

// admin transaction
adminRouter.get("/transaction",auth,adminAuth, async(req,res)=>{
    try{
        const page=Math.max(Number(req.query.page)|| 1,1);
        const limit=Math.min(Number(req.query.limit)||10,50);
        const offset=(page-1)*limit;

        const allowedTypes=["ALL", "ADD","TRANSFER"];
        const allowedStatus=["PENDING","SUCCESS","FAILED", "ALL"]
        const type=(req.query.type || "ALL").toUpperCase();
        const status=(req.query.status || "ALL").toUpperCase();

        if(!allowedTypes.includes(type)){
            return res.status(400).json({
                message:"Invalid type. Use ALL | ADD | TRANSFER"
            })
        }

        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                message:"Invalid Status. Use ALL | PENDING | SUCCESS | FAILED"
            })
        }

        let whereCondition={}
        if(type!="ALL"){
            whereCondition.type=type;
        }
        if(status!="ALL"){
            whereCondition.status=status;
        }

        const {rows,count}=await Transaction.findAndCountAll({
            where:whereCondition,
            order:[["createdAt", "DESC"]],
            limit,
            offset,
            include: [
                {
                model: Wallet,
                as: "fromWallet",
                attributes:[],
                include: [{ model: User, attributes: ["id", "email"] }]
                },
                {
                model: Wallet,
                as: "toWallet",
                attributes:[],
                include: [{ model: User, attributes: ["id", "email"] }]
                }
            ]
        })

        res.json({
            page,
            limit,
            totalTransaction:count,
            totalPages:Math.ceil(count/limit),
            transactions:rows
        })

    }
    catch(err){
        res.status(400).json({
            message:"Failed to fetch transaction",
            error:err.message
        })
    }
})

// admin audit log
adminRouter.get("/auditlog",auth,adminAuth,async(req,res)=>{
    try{
        const page=Math.max(Number(req.query.page || 1),1);
        const limit=Math.min(Number(req.query.limit || 20),50);
        const offset=(page-1)*limit;

        const{userId,transactionsId,action,fromDate,toDate}=req.query;

        const whereCondition={};
        // filter by user
        if(userId) whereCondition.userId=userId;

        // filter by transaction id
        if(transactionsId) whereCondition.transactionsId=transactionsId

        // filter by action
        if(action) whereCondition.action=action.toUpperCase();

        // filter by date range
        if(fromDate || toDate){
            whereCondition.createdAt={};
            if(fromDate){
                whereCondition.createdAt[Op.gte]=new Date(fromDate)
            }
            if(toDate){
                whereCondition.createdAt[Op.lte]=new Date(toDate)
            }
        }

        const{rows,count}=await AuditLog.findAndCountAll({
            where:whereCondition,
            order:[["createdAt", "DESC"]],
            limit,
            offset,
            include:[
                {
                    model:User,
                    attributes:["id","email"]
                },
                {
                    model:Transaction,
                    attributes:["id", "amount", "type", "status"],
                    required:false
                }
            ]
        })

        res.status(200).json({
            page,
            limit,
            totalLogs:count,
            totalpage:Math.ceil(count/limit),
            logs:rows

        })

    }
    catch(err){
        res.status(500).json({
            message:"Failed to fetch audit logs",
            error:err.message
        })
    }
})

// admin dashboard
adminRouter.get("/dashboard", auth, adminAuth,async(req,res)=>{
    try{
        const startOfToday=new Date();
        startOfToday.setHours(0,0,0,0);

        const[
            totalUsers,
            totalWallets,
            totalTransactions,
            totalVolume,
            failedTransactions,
            todayTrans,
            todayUser
        ]=await Promise.all([
            User.count(),
            Wallet.count(),
            Transaction.count(),
            Transaction.sum("amount"),
            Transaction.count({where:{status:"FAILED"}}),
            Transaction.findOne({
                attributes:[
                    [fn("COUNT", col("id")), "count"],
                    [fn("SUM",col("amount")), "volume"]
                ],
                where:{
                    createdAt:{
                        [Op.gte]:startOfToday
                    }
                }
            }),
            User.findOne({
                attributes:[
                    [fn("COUNT", col("id")),"usercount"],
                ],
                where:{
                    createdAt:{
                        [Op.gte]:startOfToday
                    }
                }
            })
        ]);

        res.status(200).json({
            users:{
                total:totalUsers
            },
            wallets:{
                total:totalWallets
            },
            transaction:{
                total:totalTransactions,
                failed:failedTransactions,
                totalVolume:totalVolume||0
            },
            today:{
                transactions:Number(todayTrans?.get("count"))||0,
                volume:Number(todayTrans?.get("volume")) ||0,
                user:Number(todayUser?.get("usercount")) ||0,
                wallet:Number(todayUser?.get("usercount")) ||0,
                
            }

            
        })
        
    }
    catch(err){
        res.status(500).json({
            message:"Failed to fetch the data",
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