const express=require("express");
const { authRouter } = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const { walletRouter } = require("./routes/walletRoutes");
const {adminRouter}=require("./routes/adminRoutes");
const app=express();
const cors=require("cors");
const {webhookHandler}=require("./utils/paymentWebhook")
const { paymentRouter } = require("./routes/paymentRoutes");
app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

app.post(
  "/api/payment/webhooks",
  express.raw({ type: "application/json" }),
  webhookHandler
);
app.use(express.json());


app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/wallet",walletRouter);
app.use("/api/admin",adminRouter);
app.use("/api/payment",paymentRouter)



module.exports=app;