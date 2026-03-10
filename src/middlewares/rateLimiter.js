const rateLimit=require("express-rate-limit");
const { MAX } = require("uuid");

// login limiter (brute force protection)
const loginLimiter=rateLimit({
    windowMs:10*60*1000, // 10MIN
    max:5,
    message:{
        message:"Too many login attempts . Try again after 10 minutes"
    }
});

// transer limiter (abuse prevention)
const transferLimiter=rateLimit({
    windowMs:1*60*1000, //1 minute
    max:10, // 10 transfer
    message:{
        message:"Too many tranfer requests. Please slow down"
    }
})

// pin limmter

const pinLimiter=rateLimit({
    windowMs:24*60*60*1000, // 1day
    max:5,
    message:"Too many incorrect pin attempts. Try again after 24hrs" 
})

module.exports={
    loginLimiter,
    transferLimiter,
    pinLimiter
}