const { NUMBER, Model } = require("sequelize");
const {sequelize} = require("../config/database");
const{User, Ledger, PaymentOrder}=require("../models")
const { auth } = require("../middlewares/auth");
const { Wallet, Transaction, AuditLog } = require("../models");
const express=require("express");
const walletRouter=express.Router();
const { Op } = require("sequelize");
const { transferLimiter, pinLimiter } = require("../middlewares/rateLimiter");
const {verifyWalletPin}=require("../middlewares/verifyWalletPin")
const bcrypt=require("bcrypt");



// get balance
walletRouter.post("/balance",auth,verifyWalletPin ,async(req,res)=>{
    try{
        const loggedInUser=req.user;
        const wallet=await Wallet.findOne({
            where:{userId:loggedInUser.id}
        })

        if(!wallet){
            return res.status(401).json({
                message:"No wallet found"
            })
        }


        res.json({
            message:"Balance info",
            balance:wallet.availableBalance,
            status:wallet.status
        })
    }


    catch(err){
        res.status(500).json({
            message:"Failed to fetch balance"
        })
    }
})

// Transfer money api
walletRouter.post("/transfer",auth, transferLimiter,pinLimiter,verifyWalletPin,async(req,res)=>{
    let t;
    let txn;

    try{
        const {phoneNumber,amount,idempotencyKey,description}=req.body;
        const amt=Number(amount);
        const fromUser=req.user;

        if(isNaN(amt) || amt<=0){
            return res.status(400).json({
                message:"Invalid amount"
            })
        }

        if(!phoneNumber){
            return res.status(400).json({
                message:"Phone Number required"
            })
        }

        t=await sequelize.transaction();
        const normalizedPhone = phoneNumber.replace(/\D/g, "");



        const toUser= await User.findOne({
            where:{phoneNumber:normalizedPhone},
            transaction:t
        })
        
        if (!toUser) {
            await t.rollback();
            return res.status(404).json({
            message: "Receiver not found"
        });
        }
        

        const toUserId=toUser.id;
        if(Number(toUserId)==Number(fromUser.id)){
            await t.rollback();
            return res.status(400).json({
                message:"Cannot transfer to self"
            })
        }

        // lock sender wallet 
        const senderWallet=await Wallet.findOne({
            where:{userId:fromUser.id},
            transaction:t,
            lock:true //lock part
        })

        if(senderWallet.status==="blocked"){
            await t.rollback();
            return res.status(400).json({
                message:"Your wallet is blocked. You can't transfer funds."
            })
        }

        // checking fromUser balance
        if(!senderWallet){
            throw new Error("Sender wallet does not exist")
        }

        if(Number(senderWallet.availableBalance)<amt){
            await t.rollback();
            return res.status(400).json({
                message:"Insufficient balance"
            })
        }


        if(!idempotencyKey){
            return res.status(400).json({
                message:"idempotency key is required"
            })
        }


        // check for dupplicate request
        const existingTxn=await Transaction.findOne({
            where:{
                idempotencyKey,
                fromWalletId:senderWallet?.id
            },
            transaction:t,
            lock:true
            
        })
        if(existingTxn){
            await t.rollback();
            return res.status(200).json({
                message:"Transfer successful",
                transactionId:existingTxn.id
            })
        }


        // lock receiver wallet
        const receiverWallet=await Wallet.findOne({
            where:{userId:toUserId},
            transaction:t,
            lock:true
        });

        if(!receiverWallet){
            throw new Error("Receiver wallet not found")
        }

        if(receiverWallet.status==="blocked"){
            await t.rollback();
            return res.status(400).json({
                message:"Receiver's Wallet is blocked. This wallet can't receive funds."
            })
        }
        
        // create a transaction record
        txn=await Transaction.create({
            amount:amt,
            type:"TRANSFER",
            status:"CREATED",
            fromWalletId:senderWallet.id,
            toWalletId:receiverWallet.id,
            idempotencyKey,
            paymentOrderId: Number(process.env.SYSTEM_PAYMENT_ORDER_ID),
            gatewayOrderId: Number(process.env.SYSTEM_GATEWAY_ORDER_ID),
            description
        },{transaction:t})

        // before state
        const sAvail = Number(senderWallet.availableBalance);
        const sHeld  = Number(senderWallet.heldBalance);
        const rAvail = Number(receiverWallet.availableBalance);
        const rHeld  = Number(receiverWallet.heldBalance);


        // move to held state
        senderWallet.availableBalance = sAvail-amt
        senderWallet.heldBalance=sHeld+amt;
        senderWallet.totalBalance=senderWallet.availableBalance+senderWallet.heldBalance;
        await senderWallet.save({transaction:t});

        txn.status = "PROCESSING";
        await txn.save({ transaction: t });



        // ledger entry
        await Ledger.create({
            transactionId:txn.id,
            debitWalletId:senderWallet.id,
            creditWalletId:receiverWallet.id,
            amount:amt,
            type:"TRANSFER"

        },{transaction:t})


        // finalize balance
        senderWallet.heldBalance-=amt;
        senderWallet.totalBalance=senderWallet.availableBalance+ senderWallet.heldBalance;
        
        receiverWallet.availableBalance=rAvail+amt
        receiverWallet.totalBalance=receiverWallet.availableBalance +rHeld;

        await senderWallet.save({transaction:t});
        await receiverWallet.save({transaction:t});

        txn.status = "SUCCESS";
        await txn.save({ transaction: t });


        // Audit logs
        await AuditLog.create({
            userId:fromUser.id,
            transactionId:txn.id,
            action:"TRANSFER_SENT",
            entityType:"WALLET",
            entityId:senderWallet.id,
            beforeState: { availableBalance: sAvail },
            afterState: { availableBalance: senderWallet.availableBalance },
            ipAddress:req.ip
        },{transaction:t})


        await AuditLog.create({
            userId:toUserId,
            transactionId:txn.id,
            action:"TRANSFER_RECEIVED",
            entityType:"WALLET",
            entityId:receiverWallet.id,
            beforeState: { availableBalance: rAvail },
            afterState: { availableBalance: receiverWallet.availableBalance },
            ipAddress:req.ip
        },{transaction:t})

        await t.commit();
        res.json({
            message:"Transfer sucessful",
            transactionId:txn.id
        })

    }
    catch(err){
        if(t) await t.rollback();
        if (txn) {
        await Transaction.update(
          { status: "FAILED" },
          { where: { id: txn.id } }
        );
        }
        res.status(500).json({
            message:"something went wrong! Transfer Money process failed , Your money isn't deducted",
            error:err.message
        })
    }
})

// set wallet pin
walletRouter.post("/set-pin", auth, async(req,res)=>{
    const t=await sequelize.transaction();
    try{    
        const walletPin = req.body?.walletPin?.toString().trim();
        
        const user=await User.findByPk(req.user.id,{
            transaction:t,
            lock:true
        })
        if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "User not found" });
        }

        if(!walletPin){
            await t.rollback();
            return res.status(400).json({
                message:"Pin is required"
            })
        }
        
        if(!/^\d{6}$/.test(walletPin)){
            await t.rollback();
            return res.status(400).json({
                message:"Pin must be exactly 6 digits"
            })
        }

        if(user.walletPinSet){
            await t.rollback();
            return res.status(400).json({
                message:"wallet pin already set"
            })
        }

        const hashedPin=await bcrypt.hash(walletPin,12);

        user.walletPin=hashedPin;
        user.walletPinSet=true;
        await user.save({transaction:t})

        await AuditLog.create({
            userId:user.id,
            action:"SET_WALLET_PIN",
            ipAddress:req.ip,
            },
        {transaction:t})

        await t.commit();

        res.status(200).json({
            message:"wallet pin set successfully"
        })

    }   
    catch(err){
        if(t) await t.rollback();                                                                                                                                                             
        res.status(500).json({
            message:"Failed to set wallet pin",
            error:err.message
        })
    }
})

// change wallet pin
walletRouter.post("/reset-pin", auth, async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction();

    const oldPin = req.body?.oldPin?.toString().trim();
    const newPin = req.body?.newPin?.toString().trim();

    if (!oldPin || !newPin) {
      await t.rollback();
      return res.status(400).json({
        message: "Both old and new PIN are required"
      });
    }

    if (oldPin === newPin) {
      await t.rollback();
      return res.status(400).json({
        message: "New PIN must be different"
      });
    }

    if (!/^\d{6}$/.test(oldPin) || !/^\d{6}$/.test(newPin)) {
      await t.rollback();
      return res.status(400).json({
        message: "PIN must be exactly 6 digits"
      });
    }

    const user = await User.findByPk(req.user.id, {
      transaction: t,
      lock: true
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.walletPinSet) {
      await t.rollback();
      return res.status(403).json({
        message: "Please set wallet PIN first"
      });
    }

    const isMatch = await bcrypt.compare(oldPin, user.walletPin);
    if (!isMatch) {
      await t.rollback();
      return res.status(401).json({
        message: "Old PIN is incorrect"
      });
    }

    const hashedPin = await bcrypt.hash(newPin, 12);
    user.walletPin = hashedPin;
    await user.save({ transaction: t });   

    await AuditLog.create({
      userId: user.id,
      action: "RESET_WALLET_PIN",
      ipAddress: req.ip
    }, { transaction: t });

    await t.commit();

    res.status(200).json({
      message: "Wallet PIN changed successfully"
    });

  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({
      message: "Resetting wallet PIN failed"
    });
  }
});



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
    const allowedTypes=["SENT", "RECEIVED", "ALL"];

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
        attributes:["fromWalletId", "toWalletId", "description", "gatewayOrderId","metadata", "referenceId", "amount", "type", "status","createdAt", "updatedAt"],
        where:whereCondition,
        order:[["createdAt","DESC"]],
        limit,
        offset,
            include: [
                {
                model: Wallet,
                as: "sender",
                attributes:["userId"],
                include: [{ model: User, attributes: ["firstName", "lastName"] }]
                },
                {
                model: Wallet,
                as: "receiver",
                attributes:["userId"],
                include: [{ model: User, attributes: ["firstName", "lastName"] }]
                }
            ]
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