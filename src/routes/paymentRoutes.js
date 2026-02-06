const express=require("express")
const {razorpay}=require("../utils/razorpay")
const {PaymentOrder}=require("../models")
const crypto=require("crypto")
const {auth}=require("../middlewares/auth")
const paymentRouter=express.Router();
const {AddMoney}=require("../utils/AddMoney")
const { webhookHandler } = require("../utils/paymentWebhook")
const {sequelize} = require("../config/database")


// creating order
paymentRouter.post("/create-order",auth,async(req,res)=>{
    const t= await sequelize.transaction();
    try{
        const {amount,clientRequestId}=req.body; //(in rupees)
        const amt=Number(amount);
        const userId=req.user.id;
        if(!Number.isFinite(amt) || amt<=0){
            await t.rollback();
            return res.status(400).json({
                message:"Invalid amount"
            })
        }

        const existing=await PaymentOrder.findOne({
            where:{userId,clientRequestId},
            transaction:t,
        })

        if(existing){
            await t.rollback();
            return res.status(400).json({
                userId,
                orderId: existing.gatewayOrderId,
                key: process.env.RAZORPAY_KEY_ID,
                amount: existing.amount,
            })
        }

        // create order on razorpay
        const order=await razorpay.orders.create({
            amount:amt*100, //paise
            currency:"INR",
            receipt: "user_" + userId + "_" + Date.now()
  
        })

        // save in db(payment order)
        const paymentOrder=await PaymentOrder.create({
            userId,
            gatewayOrderId:order.id,
            clientRequestId,
            amount:amt,
            status:"PENDING"
        },{transaction:t})

        await t.commit();

        res.json({
            userId,
            orderId:order.id,
            key:process.env.RAZORPAY_KEY_ID,
            amount:amt,
            paymentOrderId:paymentOrder.id
        })
        
    }
    catch(err){
        await t.rollback();
        res.status(500).json({  
            message:"Failed to create order",
            error:err.message
        })
    }
})

// verify route
paymentRouter.post("/verify-payment",auth,async(req,res)=>{
    try{
        const userId=req.user.id;
        // these came from razorpay checkout
        const{
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            amount,
        }=req.body;

        const body=razorpay_order_id+ "|" + razorpay_payment_id;

        const expectedSignature=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

        if(expectedSignature!== razorpay_signature){
            return res.status(400).json({
                message:"Payment verificationn failed"
            })
        }
        // payment is genninue
        res.json({ message: "Payment verified. Awaiting confirmation."});

    }
    catch(err){
        PaymentOrder.status="FAILED";
        res.status(500).json({
            message:" Payment Verification failed "
        })
    }
})

// webhooks

module.exports={paymentRouter};