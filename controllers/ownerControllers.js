const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const userSchema = require("../models/authModel")
const attendnceSchema = require("../models/attendanceModel")
const adminSchema = require("../models/adminModel")
const garageSchema = require("../models/garageModel")
const formatDate = require("../middleware/formatDateMiddleware")
const moment = require('moment');
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const { v4: uuidv4 } = require('uuid');
const multer = require("multer")
const sharp = require("sharp")




const multerStorage = multer.memoryStorage();

const multerFilter = function(req, file, cb) {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new ApiError('Only images allowed', 400), false);
    }
};




// exports.resizeImage = asyncHandler(async(req , res , next) => {
//     if(req.files.garageImages){
//           req.body.garageImages = []; // Ensure it's an empty array if no files

//           await Promise.all(
//             req.files.garageImages.map(async(img , index) => {
//                 const imageName = `uploads/garageImages-${index+1}.jpeg`;
//                 await sharp(file.buffer)
//                                 .resize(600, 600)
//                                 .toFormat('jpeg')
//                                 .jpeg({ quality: 90 })
//                                 .toFile(`uploads/garageImages/${filename}`);
                            
//                             req.body.garageImages.push(imageName)  
                
//             })
//           )
                   

//     }
   
// })



const fs = require('fs');
const path = require('path');

exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.garageImages = []; // Initialize as an empty array

    const uploadDir = path.join(__dirname, '..', 'uploads', 'garageImages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await Promise.all(
      req.files.map(async (img, index) => {
        const imageName = `garageImages-${index + 1}.jpeg`;
        const imagePath = path.join(uploadDir, imageName);

        try {
          // Resize and save the image
          await sharp(img.buffer)
            .resize(600, 600)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(imagePath);

          // Push the relative path or filename to garageImages
          req.body.garageImages.push(imageName);
        } catch (error) {
          console.error(`Error processing image ${imageName}:`, error);
          return next(new ApiError(`Failed to process image ${imageName}`, 500));
        }
      })
    );

    next(); // Proceed to the next middleware or route handler
  } else {
    next(); // No images to process, proceed to the next middleware or route handler
  }
});




const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// Correctly set the field name and maxCount based on your requirements
exports.uploadGarageImages = upload.array('garageImages', 5);

          //  Add To Wallet // 
exports.addToWallet = asyncHandler(async(req , res , next) => {
    const user = await userSchema.findByIdAndUpdate(req.params.userId,{
        
        wallet:req.body.wallet })
    res.status(200).json(  {data:user.wallet } );
    
  })





exports.getAttendanceOfCurrentDate = asyncHandler(async (req, res, next) => {
    // Get today's date in UTC
    const today = moment().startOf('day').toDate();  // Start of today
    const endOfToday = moment().endOf('day').toDate();  // End of today

    // Query for attendance records within today's date range
    const attend = await attendnceSchema.find({
        startIn: { $gte: today, $lte: endOfToday }
    });

    if (attend.length > 0) {
        // Format the dates
        const formattedAttend = attend.map(record => ( 
            {
                attendanceId: record._id.toString(), // Convert ObjectId to string
                lat: record.lat,
                lng: record.lng,
                startIn: formatDate(record.startIn),
                endtIn: formatDate(record.endIn),
                createdAt: formatDate(record.createdAt),
                updatedAt: formatDate(record.updatedAt) 
              }
          
    ));

        res.status(200).json({
            status: "Success",
            attend: formattedAttend
        });
    } else {
        res.status(404).json({
            message: "No attendance records found for today"
        });
    }
});


//                  Add New Driver or sub owner            //


// exports.addNewDriverOrSubOwner = asyncHandler(async (req, res, next) => {
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);

//     // Create the new driver or subowner
//     const admin = await adminSchema.create({
//            email: req.body.email,
//             password: hashedPassword,
//             lat: req.body.lat,
//             lng: req.body.lng,
//             salary: req.body.salary,
//             role: req.body.role,
//             garage: req.body.garage
//     });

//     const formattedAdmin = {
//         adminId: admin.id,
//         email: admin.email,
//         password: hashedPassword,
//         lat: admin.lat,
//         lng: admin.lng,
//         salary:admin.salary,
//         role: admin.role,
//         garage: admin.garage,
//         createdAt: formatDate(admin.createdAt),
//         updatedAt: formatDate(admin.updatedAt)
//     }
//     // Update the corresponding garage to add the driver or subowner
//     await garageSchema.findByIdAndUpdate(
//         req.body.garage, 
//         { 
//             $push: req.body.role === 'Driver' ? { driver: admin._id } : { subowner: admin._id } 
//         },
//         { new: true }
//     );

   

//     // Generate token
//     const token = jwt.sign({
//         adminId: admin.id, 
//         role: admin.role
//     }, process.env.JWT_SECRET_KEY, {
//         expiresIn: process.env.JWT_EXPIRE_TIME
//     });

//     res.status(200).json({ formattedAdmin, token });
// });

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

    // Populate the garage field for the admin
    const populatedAdmin = await admin.populate({
        path: 'garage', 
        model: 'Garages', 
        select: '-__v -driver -subowner' 
    });;

    const formattedAdmin = {
        adminId: populatedAdmin.id,
        email: populatedAdmin.email,
        password: hashedPassword,
        lat: populatedAdmin.lat,
        lng: populatedAdmin.lng,
        salary: populatedAdmin.salary,
        role: populatedAdmin.role,
        garage: populatedAdmin.garage, // Garage is now populated
        createdAt: formatDate(populatedAdmin.createdAt),
        updatedAt: formatDate(populatedAdmin.updatedAt)
    };

    // Update the corresponding garage to add the driver or subowner
    await garageSchema.findByIdAndUpdate(
        req.body.garage,
        { 
            $push: req.body.role === 'Driver' ? { driver: admin._id } : { subOwner: admin._id } 
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







                  //  Post Details of garage  //

// exports.addNewGarage = asyncHandler(async (req, res, next) => {
//     const { gragename, grageDescription, grageImages, gragePricePerHoure, lat, lng, openDate, endDate, active, driver, subowner } = req.body;
  
//     // Check if the garage already exists by name and location
//     const findGarage = await garageSchema.findOne({ gragename, lat, lng });
  
//     if (findGarage) {
//       return next(new ApiError("This garage already exists", 404));
//     }
  
//     // Create the garage
//     const newGarage = await garageSchema.create({
//       gragename,
//       grageDescription,
//       grageImages,
//       gragePricePerHoure,
//       lat,
//       lng,
//       openDate,
//       endDate,
//       active,
//       driver,
//       subowner
//     }).populate([
//         {
//           path: 'driver',
//           model: 'Admin', // Model to use for populating the 'driver' field
//           select: '-__v' // Exclude __v if you don't want it in the response
//         },
//         {
//           path: 'subowner',
//           model: 'Admin', // Model to use for populating the 'subowner' field
//           select: '-__v' // Exclude __v if you don't want it in the response
//         }
//       ])
  
//     // Add the garage to the respective driver and subOwner
//     await adminSchema.findByIdAndUpdate(driver, { $push: { garage: newGarage._id } });
//     await adminSchema.findByIdAndUpdate(driver, { $push: { subowner: newGarage._id } });

//     const formattedGarage = {
//         garageId: newGarage._id.toString(), // Format _id as a string
//         gragename: newGarage.gragename || '',
//         grageDescription: newGarage.grageDescription || '',
//         grageImages: newGarage.grageImages || '',
//         gragePricePerHoure: newGarage.gragePricePerHoure || 0,
//         lat: newGarage.lat || 0,
//         lng: newGarage.lng || 0,
//         openDate:formatDate(newGarage.createdAt),
//         endDate: formatDate(newGarage.updatedAt) ,/// Format ISO 8601
//         active: newGarage.active || false,
//         driver: newGarage.driver || [],
//         subOwner: newGarage.subOwner || [],
//         createdAt: formatDate(newGarage.createdAt),
//         updatedAt: formatDate(newGarage.updatedAt) // Format ISO 8601
    
//     }
  
//     res.status(200).json({
//       status: "Success",
//       message: "Garage successfully created",
//       garageDetails: formattedGarage
//     });
//   });

exports.addNewGarage = asyncHandler(async (req, res, next) => {
    const { gragename, grageDescription, gragePricePerHoure, lat, lng, openDate, endDate, active, driver, subOwner } = req.body;
  
    // Check if the garage already exists by name and location
    const findGarage = await garageSchema.findOne({ gragename, lat, lng });
  
    if (findGarage) {
      return next(new ApiError("This garage already exists", 404));
    }
  
    // Create the garage
    const newGarage = await garageSchema.create({
      gragename,
      grageDescription,
      garageImages:req.body.garageImages,
      gragePricePerHoure,
      lat,
      lng,
      openDate,
      endDate,
      active,
      driver,
      subOwner
    })
  
    // Add the garage to the respective driver and subOwner
    await adminSchema.findByIdAndUpdate(driver, { $push: { garage: newGarage._id } });
    await adminSchema.findByIdAndUpdate(subOwner, { $push: { garage: newGarage._id } });


    const populatedGarage = await garageSchema.findById(newGarage._id)
      .populate([
        {
          path: 'driver',
          model: 'Admin',
          select: '-__v -garage'
        },
        {
          path: 'subOwner',
          model: 'Admin',
         select: '-__v -garage'
        }
      ]);

    const formattedGarage = {
        garageId: populatedGarage._id.toString(),
        gragename: populatedGarage.gragename || '',
        grageDescription: populatedGarage.grageDescription || '',
        garageImages: populatedGarage.garageImages || '',
        gragePricePerHoure: populatedGarage.gragePricePerHoure || 0,
        lat: populatedGarage.lat || 0,
        lng: populatedGarage.lng || 0,
        openDate: formatDate(populatedGarage.openDate),
        endDate: formatDate(populatedGarage.endDate),
        active: populatedGarage.active || false,
        driver: populatedGarage.driver || [],
        subOwner: populatedGarage.subOwner || [],
        createdAt: formatDate(populatedGarage.createdAt),
        updatedAt: formatDate(populatedGarage.updatedAt)
    };
  
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
        const populatedGarage = await garageSchema.findById(garage._id)
        .populate([
          {
            path: 'driver',
            model: 'Admin',
            select: '-__v -garage'
          },
          {
            path: 'subOwner',
            model: 'Admin',
           select: '-__v -garage'
          }
        ]);
  
      const formattedGarage = {
          garageId: populatedGarage._id.toString(),
          gragename: populatedGarage.gragename || '',
          grageDescription: populatedGarage.grageDescription || '',
          grageImages: populatedGarage.grageImages || '',
          gragePricePerHoure: populatedGarage.gragePricePerHoure || 0,
          lat: populatedGarage.lat || 0,
          lng: populatedGarage.lng || 0,
          openDate: formatDate(populatedGarage.openDate),
          endDate: formatDate(populatedGarage.endDate),
          active: populatedGarage.active || false,
          driver: populatedGarage.driver || [],
          subOwner: populatedGarage.subOwner || [],
          createdAt: formatDate(populatedGarage.createdAt),
          updatedAt: formatDate(populatedGarage.updatedAt)
      };
    
      res.status(200).json({
        status: "Success",
        message: "Garage successfully created",
        garageDetails: formattedGarage
      });

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
        return next(new ApiError("Could not find any admin", 404));
    }
    const formattedAdmins = admin.map(admin => ({
        adminId: admin._id, // Use `_id` for adminId
        email: admin.email,
        password: admin.password,
        lat: admin.lat,
        lng: admin.lng,
        salary: admin.salary,
        role: admin.role,
        garage: admin.garage,
        createdAt: formatDate(admin.createdAt),
        updatedAt: formatDate(admin.updatedAt)
    }));

    // Return the filtered or all admins
    res.status(200).json(formattedAdmins);
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
                 res.status(200).json(  formattedAdmin );

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