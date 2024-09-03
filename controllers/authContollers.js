const userSchema = require("../models/authModel");
const ApiError = require("../utils/apiError")
const asyncHandler = require("express-async-handler");
const {  uploadSingleImage} = require("../middleware/uploadImageMiddleware");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail");
const { v4: uuidv4 } = require('uuid');
const sharp = require("sharp")
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware")
const adminSchema = require("../models/adminModel")




//    Upload Profile image and Car image  //

exports.uploadAuthImage = uploadSingleImage('profileImage');

// Resizing the image
const path = require('path');

exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    // Extract the original extension from the uploaded file
    const originalExtension = path.extname(req.file.originalname); // e.g., '.png', '.jpg'
    
    // Choose the desired format for the output (e.g., 'jpeg')
    const format = 'jpeg'; // You can also use 'png', 'webp', etc.

    // Generate a new filename with the chosen format extension
    const filename = `Users-${uuidv4()}-${Date.now()}.${format}`;

    // Process the image and change its extension
    const sharpInstance = sharp(req.file.buffer).resize(600, 600);

    // Apply the chosen format
    if (format === 'jpeg') {
      sharpInstance.jpeg({ quality: 90 });
    } else if (format === 'png') {
      sharpInstance.png({ quality: 90 });
    } else if (format === 'webp') {
      sharpInstance.webp({ quality: 90 });
    }

    // Save the file with the new format
    await sharpInstance.toFile(`uploads/profileImage/${filename}`);

    // Store the new filename in the request body to use later
    req.body.profileImage = filename;
  }

  next();
});


    //        Register      //

exports.signUp = asyncHandler(async (req , res , next) => {

    const hashedPassword = await bcrypt.hash(req.body.password,10)
    const user = await userSchema.create({

        username: req.body.username ,
        email: req.body.email , 
        password: hashedPassword, 
        phoner:req.body.phone,
        carName : req.body.carName , 
        carNumber: req.body.carNumber 

    })

    const token =jwt.sign({
        userId : user.id,  },
        process.env.JWT_SECRET_KEY,
        {expiresIn : process.env.JWT_EXPIRE_TIME}
        
        )
        const formattedUser = {
            role: user.role,
            userId: user._id, 
            username: user.username,
            email: user.email,
            carname: user.carName,
            carnumber: user.carNumber,
            saved: user.saved,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt) 
        };

        delete user._doc.password && delete user._doc.__v
        res.status(200).json({userData :formattedUser , token})

});


  








        //      Login    //

exports.login = asyncHandler(async (req,res,next) => {
    const user = await userSchema.findOne({email : req.body.email}).populate({
        path: 'saved', // Populate the saved field
        model: 'Garages', // Ensure it populates from the Garage model
        select: '-__v' // Exclude __v if you don't want it in the response
    });

    

    if(!user){
         throw new ApiError("Incorrect email or password.",404)
    }
    else {

        const checkPassword = await bcrypt.compare(req.body.password , user.password)
        if(!checkPassword){
            throw new ApiError("Incorrect email or password.",404)
        }
        else {
            const token = jwt.sign({userId : user.id} , 
                process.env.JWT_SECRET_KEY , 
                {expiresIn: process.env.JWT_EXPIRE_TIME})

                const formattedUser = {
                    role: user.role,
                    userId: user._id, 
                    username: user.username,
                    email: user.email,
                    carname: user.carName,
                    carnumber: user.carNumber,
                    saved: user.saved,
                    createdAt: formatDate(user.createdAt),
                    updatedAt: formatDate(user.updatedAt) 
                };
    
                delete user._doc.password && delete user._doc.__v
                res.status(200).json({userData :formattedUser , token})
        }

    }

})       



          //     Fogot Pssword   ///



exports.forgotPassword = asyncHandler( async( req , res , next) => {
    const user = await userSchema.findOne({email : req.body.email})

    if(!user){
        return next(new ApiError("There is no user for this email" , 404));
    }
        // generate reset code    //
        const resetCode  = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedResetCode = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');

        user.passwordResetCode = hashedResetCode;
        user.passwordResetExpires = Date.now() + 10*60*1000
        user.passwordResetVerified = false;

        await user.save();

    
        // send reset code via email // 

    const message = `Hi ${user.username},\n we receved the request to reset the password 
    on your valet_parking account , \n ${resetCode}\n`   
    
    try{
        await sendEmail({
            email: user.email,
            subject: 'Your password reset code (Valid for 10 min)',
            message:message
        })
    }
    catch(err){

        user.passwordResetCode = undefined,
        user.passwordResetExpires = undefined,
        user.passwordResetVerified = undefined;
        
        await  user.save();
        return next(new ApiError('There is an error in sending email',500 ))
        
        }
        res
          .status(200)
          .json({status:'Success' ,message:'Reset code send to email' })
    
})          



//       verify Reset code   //

exports.verifyResetCode = asyncHandler(async( req , res , next )=> {
    const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

    const user = await userSchema.findOne({passwordResetCode : hashedResetCode ,
                                         passwordResetExpires: {$gt:Date.now()}})

      if(!user){
        return next(new ApiError(" Reset code invalid or expired",404))
      }        
      
      user.passwordResetVerified = true;
      await user.save();
      res.status(200).json({status : 'Success'})
})
 

//     Reset new password   //
exports.resetPassword = asyncHandler(async( req , res , next )=>{
    const user = await userSchema.findOne({email : req.body.email})
    if(!user){
        return next(new ApiError(` There is no user for this email ${req.body.email}`,404))
    }
    if(!user.passwordResetVerified){
        return next(new ApiError(" Reset code not verifird",404))
    }
    user.password = req.body.newPassword
    user.passwordResetCode = undefined
    user.passwordResetExpires = undefined
    user.passwordResetVerified = undefined

    await user.save();

    const token = jwt.sign({userId : user.id} , process.env.JWT_SECRET_KEY, 
        {expiresIn:process.env.JWT_EXPIRE_TIME}
    )
    delete user._doc.password && delete user._doc.__v
    res.status(200).json({ useData: user , token})

})




exports.protect = asyncHandler(async( req , res , next ) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
    {
      
       token = req.headers.authorization.split(" ")[1];

    }
     if(!token){
        return next(new ApiError("You are not login , Please login to get access this route",401))
       }

       const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
       
       const currentUser =await userSchema.findById(decoded.userId)
     

       if(!currentUser){
        return next(new ApiError ("The user that belong to this token does no longer exist",401))
       }
       if(currentUser.passwordChangedAt){
    
        const passChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000 , 10 );
            
        // password changed after token created //    
       if(passChangedTimestamp > decoded.iat){
        return next(new ApiError("User recently changed his password , please login again...",401))
       }     
    }    
    req.user = currentUser;
    next()   
    
})



exports.adminProtect = asyncHandler(async( req , res , next ) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
    {
      
       token = req.headers.authorization.split(" ")[1];

    }
     if(!token){
        return next(new ApiError("You are not login , Please login to get access this route",401))
       }

       const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
       
       const currentUser =await adminSchema.findById(decoded.adminId)
     

       if(!currentUser){
        return next(new ApiError ("The user that belong to this token does no longer exist",401))
       }
       if(currentUser.passwordChangedAt){
    
        const passChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000 , 10 );
            
        // password changed after token created //    
       if(passChangedTimestamp > decoded.iat){
        return next(new ApiError("User recently changed his password , please login again...",401))
       }     
    }    
    req.admin = currentUser;
    next()   
    
})




exports.allowedTo = (...roles) => 
    asyncHandler(async (req, res, next) => {
        // Ensure req.user is set
        if (!req.user && !req.admin) {
            return next(new ApiError("User is not authenticated", 401));
        }

        // Check if the user's role or admin's role is included in the allowed roles
        const userRole = req.user ? req.user.role : null;
        const adminRole = req.admin ? req.admin.role : null;

        if (!roles.includes(userRole) && !roles.includes(adminRole)) {
            return next(new ApiError("You are not allowed to access this route", 403));
        }

        next();
    });
