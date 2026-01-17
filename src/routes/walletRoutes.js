const { NUMBER } = require("sequelize");
const {sequelize} = require("../config/database");
const { auth } = require("../middlewares/auth");
const { Wallet, Transaction, AuditLog } = require("../models");
const express=require("express");
const walletRouter=express.Router();
const { Op } = require("sequelize");

 


// get balance
walletRouter.get("/balance",auth, async(req,res)=>{
    try{
        const loggedInUser=req.user;
        const wallet=await Wallet.findOne({
            where:{userId:loggedInUser.id}
        })
        if(!wallet){
            res.status(401).json({
                message:"No wallet found"
            })
        }

        res.json({
            message:"Balance info",
            balance:wallet.balance,
            status:wallet.status
        })
    }


    catch(err){
        res.status(500).json({
            message:"Failed to fetch balance"
        })
    }
})

// add money
walletRouter.post("/add",auth,async(req,res)=>{
    const t=await sequelize.transaction();
    try{
        const {amount}=req.body;
        if(!amount || amount<=0){
            return res.status(400).json({
                message:"Invalid Amount"
            })
        }

        // lock wallet row 
        const wallet=await Wallet.findOne({
            where:{userId:req.user.id},
            lock:t.LOCK.UPDATE,
            transaction:t
        })

        // updating wallet balance-
        wallet.balance=Number(wallet.balance)+Number(amount);
        await wallet.save({transaction:t});

        // creating a trnsaction record:
        const txn=await Transaction.create({
            amount,
            type:"ADD",
            status:"SUCCESS",
            toWalletId:wallet.id
        },{transaction:t})

        // create audit log
        await AuditLog.create({
            userId:req.user.id,
            transactionId:txn.id,
            action: "ADD_MONEY",
            ipAddress:req.ip
        },{transaction:t})

        await t.commit();

        res.status(200).json({
            message:"Money Added Succesfully",
            newBalance:wallet.balance
        })

    }
    catch(err){
        await t.rollback();
        res.status(500).json({
            message:"Add money process failed",
            error:err.message
        })
    }
})

// Transfer money api
walletRouter.post("/transfer",auth, async(req,res)=>{
    const t=await sequelize.transaction();
    try{
        const {toUserId,amount}=req.body;
        const fromUser=req.user;

        if(!toUserId || !amount || amount<=0){
            await t.rollback();
            return res.status(400).json({
                message:"Invalid Request"
            })
        }

        if(Number(toUserId)==Number(fromUser.id)){
            return res.status(400).json({
                message:"Cannot transfer to self"
            })
        }
        
        // lock sender wallet 
        const senderWallet=await Wallet.findOne({
            where:{userId:fromUser.id},
            transaction:t,
            lock:t.LOCK.UPDATE //lock part
        })

        // checking fromUser balance
        if(!senderWallet){
            throw new Error("Sender wallet does not exist")
        }

        if(Number(senderWallet.balance)<Number(amount)){
            await t.rollback();
            return res.status(400).json({
                message:"Insufficient balance"
            })
        }

        // lock receiver wallet
        const receiverWallet=await Wallet.findOne({
            where:{userId:toUserId},
            transaction:t,
            lock:t.LOCK.UPDATE
        });

        if(!receiverWallet){
            throw new Error("Receiver wallet not found")
        }

        // updating balance
        senderWallet.balance=Number(senderWallet.balance)-Number(amount)
        receiverWallet.balance=Number(receiverWallet.balance)+Number(amount);

        await senderWallet.save({transaction:t});
        await receiverWallet.save({transaction:t});

        // create a transaction record
        const txn=await Transaction.create({
            amount,
            type:"TRANSFER",
            status:"SUCCESS",
            fromWalletId:senderWallet.id,
            toWalletId:receiverWallet.id
        },{transaction:t})


        // Audit logs
        await AuditLog.create({
            userId:fromUser.id,
            transactionId:txn.id,
            action:"TRANSFER_SENT",
            ipAddress:req.ip
        },{transaction:t})


        await AuditLog.create({
            userId:toUserId,
            transactionId:txn.id,
            action:"TRANSFER_RECEIVED",
            ipAddress:req.ip
        },{transaction:t})

        console.log("Sender:", senderWallet.balance);
        console.log("Receiver:", receiverWallet.balance);


        await t.commit();
        res.json({
            message:"Transfer sucessful",
            transactionId:txn.id
        })

    }
    catch(err){
        await t.rollback();
        res.status(400).json({
            message:"something went wrong! Transfer Money process failed , Your money isn't deducted",
            error:err.message
        })
    }
})

// transaction history api
walletRouter.get("/transaction",auth,async(req,res)=>{
    try{
    const user=req.user.id;

    if(!user){
        return res.status(401).json({
            message:"User does not found"
        })
    }
    const page=Math.max(Number(req.query.page)|| 1,1);
    const limit=Math.min(Number(req.query.limit) || 10,50);
    const offset=(page-1)*limit;

    const type=(req.query.type || "ALL").toUpperCase();
    const allowedTypes=["ALL", "SENT","RECEIVED"];

    if(!allowedTypes.includes(type)){
        return res.status(400).json({
            message:"Invalid type. Use ALL | SENT | RECEIVED",
        })
    }

    const wallet=await Wallet.findOne({
        where:{userId:user}
    })

    if(!wallet){
        return res.status(404).json({
            message:"Wallet not found"
        })
    }

    // build where condtion
    let whereCondition={};

    if(type==="SENT"){
        whereCondition={fromWalletId:wallet.id};
    }
    else if(type==="RECEIVED"){
        whereCondition={toWalletId:wallet.id};
    }
    else whereCondition={
        [Op.or]:[
            {fromWalletId:wallet.id},
            {toWalletId:wallet.id}
        ]
    }

    // fetch transaction
    const {count,rows}=await Transaction.findAndCountAll({
        where:whereCondition,
        order:[["createdAt","DESC"]],
        limit,
        offset
    });

    res.json({
        page,
        limit,
        type,
        totalTransaction:count,
        totalPages:Math.ceil(count/limit),
        transaction:rows
    })

    }
    catch(err){
        res.status(500).json({
            message:"Failed to fetch transaction history",
            error:err.message
        })
    }


})

module.exports={walletRouter};