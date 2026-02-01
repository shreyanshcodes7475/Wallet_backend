const express=require("express")
const {razorpay}=require("../utils/razorpay")
const {PaymentOrder}=require("../models")

const paymentrouter=express.Router();

paymentrouter.post("/create-order",async(req,res)=>{
    try{
        const {amount}=req.body; //(in rupees)
        const amt=Number(amount);
        const userId=req.user.id;

        if(!Number.isFinite(amt) || amt<=0){
            return res.status(400).json({
                message:"Invalid amount"
            })
        }

        // create order on razorpay
        const order=await razorpay.orders.create({
            amount:amt*100, //paise
            currency:"INR",
            receipt:"rcpt_"+Date.now() 
        })

        // save in db(payment order)
        const paymentOrder=await PaymentOrder.create({
            gatewayOrderId:order.id,
            amount:amt,
            status:"CREATED"
            
        })


        res.json({
            userId,
            orderId:order.id,
            key:process.env.RAZORPAY_KEY_ID,
            amount:amt,
            paymentOrderId:paymentOrder.id
        })
    }
    catch(err){
        res.status(500).json({
            message:"Failed to create order",
            error:err.message
        })
    }
})


module.exports={paymentrouter};