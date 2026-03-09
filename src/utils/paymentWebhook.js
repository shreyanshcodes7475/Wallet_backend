const crypto=require("crypto");
const {PaymentOrder}=require("../models");
const {AddMoney}=require("./AddMoney");
const {sequelize} = require("../config/database");


const webhookHandler=async (req,res)=>{
    const t=await sequelize.transaction();
    try{
        const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature=req.headers["x-razorpay-signature"];
        const body=req.body;

        const expectedSignature=crypto
                .createHmac("sha256",secret)
                .update(body)
                .digest("hex");

        if(signature!==expectedSignature){
            await t.rollback();
            return res.status(400).json({
                message:"Invalid signature"
            })
        }
        const event=JSON.parse(body.toString());

        // 1️⃣ Handle failure FIRST
        if (event.event === "payment.failed") {
            const payment = event.payload.payment?.entity;
            const razorpayOrderId = payment.order_id;

            const paymentOrder = await PaymentOrder.findOne({
                where: { gatewayOrderId: razorpayOrderId },
                transaction: t,
                lock: true
            });

            if (paymentOrder && paymentOrder.status === "PENDING") {
                paymentOrder.status = "FAILED";
                await paymentOrder.save({ transaction: t });
            }
            await t.commit();
            return res.status(200).send("Failure recorded");
        }

        // 2️⃣ Allow only success events kuch or mille to
        if (event.event !== "payment.captured" && event.event !== "order.paid") {
            await t.rollback();
            return res.status(200).send("Event ignored");
        }
        
        const payment = event.payload.payment?.entity;
        if (!payment) {
            await t.rollback();
            return res.status(400).send("Payment data missing");
        }

        const razorpayOrderId=payment.order_id;
        const razorpayPaymentId=payment.id;
        const amount=payment.amount/100;

        const paymentOrder = await PaymentOrder.findOne({
        where: { gatewayOrderId: razorpayOrderId },
        transaction:t,
        lock:true
        });

        if(!paymentOrder){
            await t.rollback();
            return res.status(404).json({
                message:"Payment order missing"
            })
        }
        if (paymentOrder.status === "FAILED") {
        return res.status(200).send("Order already closed");
        }

        // already processed ?
        if(paymentOrder.status=="SUCCESS"){
            await t.rollback();
            return res.status(200).send("Already processed");
        }
        const ip="1.1.1.11"

        // credit wallet
        await AddMoney(
        amount,
        paymentOrder.userId,
        razorpayPaymentId ,  // idempotencyKey
        ip,
        paymentOrder.id,
        razorpayOrderId,
        t
        )
        
        paymentOrder.status="SUCCESS"
        await paymentOrder.save({transaction:t});

        await t.commit();

        res.status(200).send("ok");

    }
    catch(err){
    await t.rollback();
    res.status(500).send("Webhook failed");

    }
}

module.exports={webhookHandler}