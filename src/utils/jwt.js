const jwt=require("jsonwebtoken");
const { User } = require("../models/User");

const generateToken=()=>{
    const token=jwt.sign({
        id:User.id,
        email:User.email,
        role:User.role

    }, process.env.JWT_SECRET,{
        expiresIn: "8h",
    })
    return token;
}

module.exports={generateToken};