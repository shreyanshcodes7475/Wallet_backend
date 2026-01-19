const express=require("express");
const { authrouter } = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const { walletRouter } = require("./routes/walletRoutes");
const {adminRouter}=require("./routes/adminRoutes");
// const { adminRouter } = require("./routes/adminRoutes");
const app=express();
app.use(cookieParser())
app.use(express.json());



app.use("/api/admin", adminRouter);
app.use("/api/auth", authrouter);
app.use("/api/wallet",walletRouter);
app.use("/api/admin",adminRouter);


module.exports=app;