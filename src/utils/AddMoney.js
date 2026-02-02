const {sequelize} = require("../config/database");
const{User, Ledger, Wallet,Transaction, AuditLog,PaymentOrder}=require("../models")
const { Op } = require("sequelize");

const AddMoney=async(amount,userId,idempotencyKey,ipAddress)=>{
    let t;
    let txn;
    try{
        const amt=Number(amount);

        if(!amt || amt<=0) throw new Error("Invalid amount"); 
        if(!idempotencyKey) throw new Error("Idempotent key is required");
        
        t=await sequelize.transaction();
        // lock wallet row 
            const wallet=await Wallet.findOne({
            where:{userId},
                lock:t.LOCK.UPDATE,
                transaction:t
            })
        if(!wallet) throw new Error("Wallet not found")

        const earlierBalance=Number(wallet.availableBalance);
        
        const existingTxn=await Transaction.findOne({
            where:{ 
                idempotencyKey,
                toWalletId:wallet.id     
            },
            transaction:t
        })

        if(existingTxn){
            await t.rollback();
            return {
                message:"Money Added Succesfully",
                transactionId:existingTxn.id,
                newBalance:wallet.availableBalance
            }
        }

        // creating a trnsaction record:
        txn=await Transaction.create({
            amount:amt,
            type:"ADD",
            status:"CREATED",
            fromWalletId: Number(process.env.SYSTEM_WALLET_ID),
            toWalletId:wallet.id,
            idempotencyKey,
            paymentOrderId: Number(process.env.SYSTEM_PAYMENT_ORDER_ID),
            gatewayOrderId: Number(process.env.SYSTEM_GATEWAY_ORDER_ID)
        },{transaction:t})
        
        // Ledger entry(system->user)
        await Ledger.create({
            transactionId:txn.id,
            debitWalletId:Number(process.env.SYSTEM_WALLET_ID),
            creditWalletId:wallet.id,
            amount:amt,
            type:"DEPOSIT"
        },{transaction:t})
        
        
        // updating wallet balance-
        wallet.availableBalance = Number(wallet.availableBalance) + amt;
        wallet.totalBalance=wallet.availableBalance+Number(wallet.heldBalance)
        await wallet.save({transaction:t});

        // mark transaction success
        txn.status="SUCCESS"
        await txn.save({transaction:t});


        // create audit log
        await AuditLog.create({
            userId,
            transactionId:txn.id,
            action: "DEPOSIT_SUCCESS",
            entityType:"WALLET",
            entityId:wallet.id,
            beforeState:{availableBalance:earlierBalance},
            afterState:{availableBalance:wallet.availableBalance},
            ipAddress
        },{transaction:t})

        await t.commit();

        return{
            message:"Money Added Succesfully",
            transactionId:txn.id,
            newBalance:wallet.availableBalance
        }

    }
    catch(err){
        if(t) await t.rollback();
        if (txn) {
        await Transaction.update(
          { status: "FAILED" },
          { where: { id: txn.id } }
        );
        throw err;
    }

    }
}

module.exports={AddMoney};