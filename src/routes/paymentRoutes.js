const express=require("express")
const {razorpay}=require("../utils/razorpay")
const {PaymentOrder}=require("../models")
const crypto=require("crypto")
const {auth}=require("../middlewares/auth")
const paymentRouter=express.Router();
const {AddMoney}=require("../utils/AddMoney")


// creating order
paymentRouter.post("/create-order",auth,async(req,res)=>{
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
            userId,
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
        const result = await AddMoney(amount, userId, razorpay_payment_id, req.ip);
        console.log("BODY:", razorpay_order_id + "|" + razorpay_payment_id);
        console.log("EXPECTED:", expectedSignature);
        console.log("RECEIVED:", razorpay_signature);

        res.json({ message: "Wallet credited", data: result });

    }
    catch(err){
        res.status(500).json({
            message:" Payment Verification failed "
        })
    }
})


module.exports={paymentRouter};