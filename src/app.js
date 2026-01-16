const express=require("express");
const { authrouter } = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const { walletRouter } = require("./routes/walletRoutes");
const app=express();
app.use(cookieParser())
app.use(express.json());
app.use("/api/auth", authrouter);
app.use("/api/wallet",walletRouter)
app.get("/", (req,res)=>{
    res.json({message: "vaultpay api running"});
})

module.exports=app;