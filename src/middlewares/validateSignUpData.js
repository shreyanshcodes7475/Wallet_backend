const validator=require("validator");

const validateSignUpData=(req,res,next)=>{
    let {firstName,lastName,email, password,phoneNumber}=req.body;

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: "All fields are required" });
    }

    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.toLowerCase().trim();

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

    req.body.phoneNumber = phoneNumber.replace(/\D/g, "").slice(-10);
    req.body.firstName = firstName;
    req.body.lastName = lastName;
    req.body.email = email;

    next();

}

module.exports={validateSignUpData};