const userSchema = require("../models/authModel");
const ApiError = require("../utils/apiError")
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail");
const { v4: uuidv4 } = require('uuid');
const sharp = require("sharp")
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware")
const adminSchema = require("../models/adminModel")
const multer = require("multer")



const multerStorage = multer.memoryStorage();

const multerFilter = function(req, file, cb) {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new ApiError('Only images allowed', 404), false);
    }
};

// exports.resizeImage = asyncHandler(async (req, res, next) => {
//     // Check if both images are uploaded
//     if (req.files && req.files.profileImage && req.files.carImage) {
//         // Process profileImage
//         const profileImageFilename = `profileImage-${uuidv4()}-${Date.now()}.jpeg`;
//         await sharp(req.files.profileImage[0].buffer)
//             .resize(600, 600)
//             .toFormat('jpeg')
//             .jpeg({ quality: 90 })
//             .toFile(`uploads/userImages/${profileImageFilename}`);
//         req.body.profileImage = profileImageFilename;

//         // Process carImage
//         const carImageFilename = `carImage-${uuidv4()}-${Date.now()}.jpeg`;
//         await sharp(req.files.carImage[0].buffer)
//             .resize(600, 600)
//             .toFormat('jpeg')
//             .jpeg({ quality: 90 })
//             .toFile(`uploads/userImages/${carImageFilename}`);
//         req.body.carImage = carImageFilename;
//     }
//     next();
// });
exports.resizeImage = asyncHandler(async (req, res, next) => {
    // Check if both images are uploaded
    if (req.files && req.files.profileImage && req.files.carImage) {
        // Helper function to get file extension
        const getFileExtension = (mimeType) => {
            switch (mimeType) {
                case 'image/jpeg':
                    return 'jpeg';
                case 'image/jpg':
                    return 'jpg';
                case 'image/png':
                    return 'png';
                default:
                    return 'jpeg'; // Default to jpeg if format is not recognized
            }
        };

        // Process profileImage
        const profileImageExtension = getFileExtension(req.files.profileImage[0].mimetype);
        const profileImageFilename = `profileImage-${uuidv4()}-${Date.now()}.${profileImageExtension}`;
        await sharp(req.files.profileImage[0].buffer)
            .resize(600, 600)
            .toFormat(profileImageExtension)
            [profileImageExtension]({ quality: 90 }) // Dynamic function call
            .toFile(`uploads/userImages/${profileImageFilename}`);
        req.body.profileImage = profileImageFilename;

        // Process carImage
        const carImageExtension = getFileExtension(req.files.carImage[0].mimetype);
        const carImageFilename = `carImage-${uuidv4()}-${Date.now()}.${carImageExtension}`;
        await sharp(req.files.carImage[0].buffer)
            .resize(600, 600)
            .toFormat(carImageExtension)
            [carImageExtension]({ quality: 90 }) // Dynamic function call
            .toFile(`uploads/userImages/${carImageFilename}`);
        req.body.carImage = carImageFilename;
    }
    next();
});


const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadAuthImage = upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'carImage', maxCount: 1 }
]);

// Register
exports.signUp = asyncHandler(async (req, res, next) => {
    // const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await userSchema.create({
        username: req.body.username,
        email: req.body.email,
        password:req.body.password,
        phone: req.body.phone,
        profileImage: req.body.profileImage, // Correctly set the profileImage
        carName: req.body.carName,
        carNumber: req.body.carNumber,
        carImage: req.body.carImage, // Correctly set the carImage
    });

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRE_TIME }
    );

    const formattedUser = {
        userId: user._id,
        username: user.username,
        email: user.email,
        password: user.password,
        phone: user.phone,
        profileImage: user.profileImage,
        carName: user.carName,
        carNumber: user.carNumber,
        carImage: user.carImage,
        saved: user.saved,
        role: user.role,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt)
    };

    res.status(201).json({ userData: formattedUser, token });
});

    




        //      Login    //


    exports.login = asyncHandler(async (req, res, next) => {
            const foundUser = await userSchema.findOne({ email: req.body.email }).populate({
                path: 'saved',
                model: 'Garages',
                select: '-__v'
            });
        
            if (!foundUser) {
                throw new ApiError("Incorrect email or password.", 404);
            }

            const checkPassword = await bcrypt.compare(req.body.password, foundUser.password);
            if (!checkPassword) {
                throw new ApiError("Incorrect email or password.", 404);
            }
        
            const token = jwt.sign(
                { userId: foundUser.id },
                process.env.JWT_SECRET_KEY,
                { expiresIn: process.env.JWT_EXPIRE_TIME }
            );
            const formattedUser = {
                role: foundUser.role,
                userId: foundUser._id,
                username: foundUser.username,
                email: foundUser.email,
                carName: foundUser.carName,
                carNumber: foundUser.carNumber,
                saved: foundUser.saved.map(item => ({
                    ...item.toObject(), 
                    openDate:formatDate(item.openDate),
                    endDate: formatDate(item.endDate),// Convert to a plain object if needed (e.g., Mongoose document)
                    createdAt: formatDate(item.createdAt),
                    updatedAt: formatDate(item.updatedAt)
                })),
                createdAt: formatDate(foundUser.createdAt),
                updatedAt: formatDate(foundUser.updatedAt)
            };
        
            res.status(200).json({ userData: formattedUser, token });
        });

 

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
