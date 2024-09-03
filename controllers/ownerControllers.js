const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const userSchema = require("../models/authModel")
const attendnceSchema = require("../models/attendanceModel")
const adminSchema = require("../models/adminModel")
const garageSchema = require("../models/garageModel")
const {uploadMixOfImage}  =require("../middleware/uploadImageMiddleware");
const formatDate = require("../middleware/formatDateMiddleware")

const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto")




          //  Add To Wallet // 
exports.addToWallet = asyncHandler(async(req , res , next) => {
    const user = await userSchema.findByIdAndUpdate(req.params.userId,{
        
        wallet:req.body.wallet })
    res.status(200).json(  {data:user.wallet } );
    
  })






exports.getAttendanceOfCurrentDate = asyncHandler(async (req, res, next) => {
    // Get today's date
    const today = new Date();
    // Set the start of today (00:00:00)
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    // Set the end of today (23:59:59)
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Query for attendance records within today's date range
    const attend = await attendnceSchema.find({
        startIn: { $gte: startOfToday, $lte: endOfToday }
    });

    if (attend.length > 0) {    
        res.status(200).json({ 
            status: "Success",
            attend: attend 
        });
    } else {
        res.status(404).json({ 
            message: "No attendance records found for today" 
        });
    }
});
 

//                  Add New Driver or sub owner            //


// exports.addNewDriverOrSubOwner = asyncHandler(async(req, res, next) => {

//     const hashedPassword = await bcrypt.hash(req.body.password,10)

//  const admin = await adminSchema.create({
//     email: req.body.email,
//     password: hashedPassword,
//     lat: req.body.lat,
//     lng: req.body.lng,
//     salary: req.body.salary,
//     role: req.body.role,
//     garage: req.body.garage
//  })
//  const token =jwt.sign({
//     adminId : admin.id, 
//     role:req.body.role              },
//     process.env.JWT_SECRET_KEY,
//     {expiresIn : process.env.JWT_EXPIRE_TIME}
    
//     )
    

//  res.status(200).json({admin , token})
// })

exports.addNewDriverOrSubOwner = asyncHandler(async (req, res, next) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create the new driver or subowner
    const admin = await adminSchema.create({
           email: req.body.email,
            password: hashedPassword,
            lat: req.body.lat,
            lng: req.body.lng,
            salary: req.body.salary,
            role: req.body.role,
            garage: req.body.garage
    });

    const formattedAdmin = {
        adminId: admin.id,
        email: admin.email,
        password: hashedPassword,
        lat: admin.lat,
        lng: admin.lng,
        salary:admin.salary,
        role: admin.role,
        garage: admin.garage,
        createdAt: formatDate(admin.createdAt),
        updatedAt: formatDate(admin.updatedAt)
    }
    // Update the corresponding garage to add the driver or subowner
    await garageSchema.findByIdAndUpdate(
        req.body.garage, 
        { 
            $push: req.body.role === 'Driver' ? { driver: admin._id } : { subowner: admin._id } 
        },
        { new: true }
    );

   

    // Generate token
    const token = jwt.sign({
        adminId: admin.id, 
        role: admin.role
    }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE_TIME
    });

    res.status(200).json({ formattedAdmin, token });
});

 
  




  //              login Driver or sub owner       //

exports.login = asyncHandler(async (req,res,next) => {
    const admin = await adminSchema.findOne({email : req.body.email})
   

    if(!admin){
         throw new ApiError("Incorrect email or password .",404)
    }
    else {

        const checkPassword = await bcrypt.compare(req.body.password , admin.password)
        if(!checkPassword){
            throw new ApiError("Incorrect email or password .",404)
        }
        else {
            const token =jwt.sign({
                adminId : admin.id, 
                role:req.body.role              },
                process.env.JWT_SECRET_KEY,
                {expiresIn : process.env.JWT_EXPIRE_TIME}
                
                )
                const formattedAdmin = {
                    adminId: admin.id,
                    email: admin.email,
                    password: admin.password,
                    lat: admin.lat,
                    lng: admin.lng,
                    salary:admin.salary,
                    role: admin.role,
                    garage: admin.garage,
                    createdAt: formatDate(admin.createdAt),
                    updatedAt: formatDate(admin.updatedAt)
                }
    
                delete admin._doc.password && delete admin._doc.__v
                res.status(200).json({adminData :formattedAdmin , token})
        }

    }

})       




exports.uploadGrageImages = uploadMixOfImage([
    
    {  name:'grageImages',
       maxCount:6
     }

 ])



                  //  Post Details of garage  //

//  exports.addNewGarage = asyncHandler(async (req , res , next) => {

//       const findGrage = await garageSchema.findOne(req.body)
//                if(findGrage){
//                  throw next(new ApiError("this garage is already exists" , 404))
//                       }
                
//               else{
//                  const grage = await garageSchema.create({
                
//                    gragename:req.body.gragename,
//                    grageDescription:req.body.grageDescription,
//                    grageImages:req.body.grageImages,
//                    gragePricePerHoure:req.body.gragePricePerHoure,
//                    lat:req.body.lat,
//                    lng:req.body.lng,
//                    openDate:req.body.openDate,
//                    endDate:req.body.endDate,
//                    active:req.body.active,
//                    driver:req.body.driver,
//                    subowner:req.body.subowner
//                                  })

//                         res.status(200).json({"Grage Details": grage})
//                     }
                
//                 })       

exports.addNewGarage = asyncHandler(async (req, res, next) => {
    const { gragename, grageDescription, grageImages, gragePricePerHoure, lat, lng, openDate, endDate, active, driver, subowner } = req.body;
  
    // Check if the garage already exists by name and location
    const findGarage = await garageSchema.findOne({ gragename, lat, lng });
  
    if (findGarage) {
      return next(new ApiError("This garage already exists", 404));
    }
  
    // Create the garage
    const newGarage = await garageSchema.create({
      gragename,
      grageDescription,
      grageImages,
      gragePricePerHoure,
      lat,
      lng,
      openDate,
      endDate,
      active,
      driver,
      subowner
    });
  
    // Add the garage to the respective driver and subOwner
    await adminSchema.findByIdAndUpdate(driver, { $push: { garage: newGarage._id } });
    await adminSchema.findByIdAndUpdate(driver, { $push: { subowner: newGarage._id } });

    const formattedGarage = {
        garageId: newGarage._id.toString(), // Format _id as a string
        gragename: newGarage.gragename || '',
        grageDescription: newGarage.grageDescription || '',
        grageImages: newGarage.grageImages || '',
        gragePricePerHoure: newGarage.gragePricePerHoure || 0,
        lat: newGarage.lat || 0,
        lng: newGarage.lng || 0,
        openDate:formatDate(newGarage.createdAt),
        endDate: formatDate(newGarage.updatedAt) ,/// Format ISO 8601
        active: newGarage.active || false,
        driver: newGarage.driver || [],
        subOwner: newGarage.subOwner || [],
        createdAt: formatDate(newGarage.createdAt),
        updatedAt: formatDate(newGarage.updatedAt) // Format ISO 8601
    
    }
  
    res.status(200).json({
      status: "Success",
      message: "Garage successfully created",
      garageDetails: formattedGarage
    });
  });
  

 //           Update  Specific  Garage Data         //

  exports.updateSpecificGarage = asyncHandler(async(req , res , next) => {
    const { gragename, grageDescription, grageImages, gragePricePerHoure, lat, lng, openDate, endDate, active, driver, subowner } = req.body;
  
        const garage = await garageSchema.findByIdAndUpdate(req.params.garageId,{

            gragename,
            grageDescription,
            grageImages,
            gragePricePerHoure,
            lat,
            lng,
            openDate,
            endDate,
            active,
            driver,
            subowner
        } , {new : true})

        
    if(!garage){
        return next(new ApiError(`Could not find any garage for this garage id ${req.params.garageId}`, 404));

    }
    else{
        res.status(200).json({'Garage after update':garage})

    }

    
  })


  //           Delet Specific  Garage Data         //

  exports.deleteSpecificGarageData = asyncHandler(async(req , res , next) => {

    const garage = await garageSchema.findByIdAndDelete(req.params.garageId)

        if(!garage){
        return next(new ApiError(`Could not find any garage for this garage id ${req.params.garageId}`, 404));

    }
    else{
        res.status(200).json('Garage deleated successfully')

    }

  })



  //        Get All Driver  Or  SubOwner     //

  exports.getAllAdmin = asyncHandler(async (req, res, next) => {
    
    const filter = req.query;

    // Fetch garages based on the filter
    const admin = await adminSchema.find(filter);

    // Handle the case where no garages are found
    if (!admin || admin.length === 0) {
        return next(new ApiError("Could not find any garage", 404));
    }

    // Return the filtered or all garages
    res.status(200).json(  admin );
});


    //          Update  Admin   //

    exports.updataAdminData = asyncHandler(async(req , res , next) => {
        const admin = await adminSchema.findByIdAndUpdate(req.params.adminId, {
            lat: req.body.lat,
            lng: req.body.lng,
            salary: req.body.salary,
            role: req.body.role,
            garage: req.body.garage
        } , {new : true})
        if(!admin){
        return next(new ApiError(`Could not find any admin for this id ${req.params.adminId}`, 404));

        }
        else{
                 res.status(200).json(  admin );

        }
    })


    //        Delet Specific  Admin   //
    exports.removeSpecificAdmin = asyncHandler(async(req , res , next) => {

        const admin = await adminSchema.findByIdAndDelete(req.params.adminId)
    
            if(!admin){
            return next(new ApiError(`Could not find any admin for this garage id ${req.params.adminId}`, 404));
    
        }
        else{
            res.status(200).json('Admin deleated successfully')
    
        }
    
      })