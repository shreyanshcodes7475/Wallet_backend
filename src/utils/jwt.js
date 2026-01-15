const jwt=require("jsonwebtoken");
const { User } = require("../models/User");

const generateToken=(user)=>{
    const token=jwt.sign({
        id:user.id,
        email:user.email,
        role:user.role

    }, process.env.JWT_SECRET,{
        expiresIn: "8h",
    })
    return token;
}

module.exports={generateToken};