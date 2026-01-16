const jwt=require("jsonwebtoken");
const { User } = require("../models");

const auth=async(req,res,next)=>{
    try{
        const token=req.cookies.token;
        if(!token){
            return res.status(401).json({
                message:"Unauthroized"
            })
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findByPk(decoded.id);
        console.log(decoded);
        if(!user) {
            return res.status(401).json({
                message:"User not found"
            })
        }

        req.user=user;
        next();
    }
    catch(err){
        return res.status(401).json({
            message:"Invalid or expired tokens"
        })

    }
}

module.exports={auth};