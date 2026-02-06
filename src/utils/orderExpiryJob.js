const cron=require("node-cron")
const {PaymentOrder}=require("../models");
const { where, Op } = require("sequelize");

cron.schedule("1 * * * * *",async(req,res)=>{
    try{
        const cutoff = new Date(Date.now() - 1 * 60 * 1000);
    
        const [updated]=await PaymentOrder.update(
            {status:"FAILED"},
            {where:{
                status:"PENDING",
                createdAt:{[Op.lt]:cutoff}
            }
        }
        )
    }
    catch(err){
        console.error("Order expiry cron failed", err);
    }
})

