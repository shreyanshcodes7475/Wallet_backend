const adminAuth=(req,res,next)=>{
    if(!req.user){
        return res.status(401).json({
            message:"Unauthorized",
        })
    }

    if(req.user.role!=="admin"){
        return res.status(403).json({
            message:"Acess denied! Admins only"
        })
    }

    next();
}

module.exports= {adminAuth};