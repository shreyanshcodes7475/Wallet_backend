const validator=require("validator");

const validateSignUpData=(req,res,next)=>{
    const {firstName,lastName,email, password,phoneNumber}=req.body;

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: "All fields are required" });
    }

    if(!validator.isMobilePhone(phoneNumber,"en-IN")){
        return res.status(400).json({
            message:"Enter a 10 digit valid phone number"
        })
    }

    if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validator.isStrongPassword(password)) {
    return res.status(400).json({ 
        message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character" 
    });
    }

    next();

}

module.exports={validateSignUpData};