const bcrypt =require("bcrypt");

const verifyWalletPin=async (req,res,next)=>{

    try{
        const walletPin=req.body?.walletPin?.toString().trim();
        const user=req.user;
    
        if(!walletPin){
            return res.status(400).json({
                message:"Pin is required"
            })
        }

        // Must be exactly 6 digits
        if (!/^\d{6}$/.test(walletPin)) {
        return res.status(400).json({
            message: "Invalid wallet pin"
        });
        }
    
        if(!user.walletPinSet){
            return res.status(403).json({
                message:"wallet pin not set"
            })
        }
    
        const isVaild= await bcrypt.compare(walletPin,user.walletPin)
    
        if(!isVaild){
            return res.status(401).json({
                message:"Invalid wallet pin"
            })
        }
    
        next();
    }
    catch(err){
        res.status(500).json({
            message:"Pin verification failed"
        })
    }
}

module.exports={verifyWalletPin};