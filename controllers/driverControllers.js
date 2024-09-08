const asyncHandler = require("express-async-handler");
const garageSchema = require("../models/garageModel")
const userSchema = require("../models/authModel");
const orderSchema = require("../models/oderModel")
const attendnceSchema = require("../models/attendanceModel");
const ApiError = require("../utils/apiError");
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware")





 


  ///   Make garage active or not   //

  exports.activeGarage = asyncHandler(async (req, res, next) => {
    const garage = await garageSchema.findByIdAndUpdate(
        req.params.garageId,
        {active:req.body.active }, {new : true}
        
    );

    if (!garage) {
        return res.status(404).json({
            status: "Error",
            message: "garage not found"
        });
    }
    const formattedGarage = {        driver: garage.driver || [],
      subOwner: garage.subOwner || [],
      garageId: garage._id.toString(), // Format _id as a string
      gragename: garage.gragename || '',
      grageDescription: garage.grageDescription || '',
      grageImages: garage.grageImages || '',
      gragePricePerHoure: garage.gragePricePerHoure || 0,
      lat: garage.lat || 0,
      lng: garage.lng || 0,
      openDate:formatDate(garage.createdAt),
      endDate: formatDate(garage.updatedAt) ,/// Format ISO 8601
      active: garage.active || false,
      createdAt: formatDate(garage.createdAt),
      updatedAt: formatDate(garage.updatedAt) }
      
    res.status(200).json({
        status: "Success",
        message: "Garage added successfully to your active list",
        data: formattedGarage
    });
});



///       Add New User   //

exports.addNewUser = asyncHandler(async(req , res , next) => {
    const foundUser  = await userSchema.findOne({email : req.body.email})
    
        if(foundUser){
            throw new ApiError("this user is already exist .",404)
       }
       else{
        const user = await userSchema.create({
            email: req.body.email,
            password: req.body.password
        })
        
        const formattedUser = {
           userId: user._id, 
          email: user.email,
          password:user.password,
          createdAt: formatDate(user.createdAt),
          updatedAt: formatDate(user.updatedAt) 
      };
        res.status(200).json({userData: formattedUser})
       }
    
})





exports.takeAttendanceStartIn = asyncHandler(async (req, res, next) => {
  try {
    // Get the garage ID and startIn from the request body
    const { garageId } = req.body;
    
    // Fetch the garage
    const garage = await garageSchema.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    // Convert startIn and garage.openDate to Date objects
    const startDate = Date.now();
    const garageStartDate = new Date(garage.openDate);

    // Determine status based on comparison
    let status = 'present'; // Default to 'present' if not late
    if (startDate > garageStartDate) {
      status = 'late';
    }

    // Create attendance record
    const attendance = await attendnceSchema.create({
      admin: req.admin._id,
      lat: req.body.lat,
      lng: req.body.lng,
      startIn: startDate,
      endIn: null,
      status,
      garageId:garage
    });

    // Format the response
    const formatAttendance = {
      attendanceId: attendance._id.toString(), // Convert ObjectId to string
      lat: attendance.lat,
      lng: attendance.lng,
      startIn: formatDate(startDate),
      endIn: null,
      status,
      createdAt: formatDate(attendance.createdAt),
      updatedAt: formatDate(attendance.updatedAt) 
    };

    res.status(200).json({ formatAttendance });
  } catch (error) {
    next(error); // Handle any errors
  }
});



  exports.takeAttendancesEndIn = asyncHandler(async(req , res , next) => {
    try {
        // Get the garage ID and startIn from the request body
        const { garageId, lat, lng } = req.body;
        
        // Fetch the garage start time
        const garage = await garageSchema.findById(garageId);
        if (!garage) {
          return res.status(404).json({ message: 'Garage not found' });
        }
    
        // Convert startIn and garage.openDate to Date objects
        const endDate = Date.now();
        const garageStartDate = new Date(garage.endDate);
    
        
    
        // Determine status based on comparison
        let status = 'present'; // Default to 'present' if not late
        if (startDate > garageStartDate) {
          status = 'late';
        }
    
        // Create attendance record
        const attendance = await attendnceSchema.create({
          admin: req.admin._id,
          lat,
          lng,
          startIn: null,
          endIn: endDate,
          status
        });
        const formatAttendance = {
          attendanceId: attendance._id.toString(), // Convert ObjectId to string
          lat: attendance.lat,
          lng: attendance.lng,
          startIn: null,
          endtIn: formatDate(endDate),
          status,
          createdAt: formatDate(attendance.createdAt),
          updatedAt: formatDate(attendance.updatedAt) 
        };
    
        res.status(200).json({ formatAttendance });
    
      } catch (error) {
        next(error); // Handle any errors
      }
  })


  // exports.updteOrder = asyncHandler(async(req, res, next) => {
  //   const order = await orderSchema.findByIdAndUpdate(req.params.orderId , {
  //       Date: req.body.Date,
  //       timeRange: req.body.timeRange,
  //       totalPrice: req.body.totalPrice,
  //       duration: req.body.duration,
  //       paymentMethod: req.body.paymentMethod,
  //       isPaid: req.body.isPaid,
  //       status: req.body.status
  //   } , {new : true})
  //   if(!order){
  //       return next (new ApiError(`could not found any order by this id ${req.params.orderId} `,404))   

  //   }
  //   else{
  //       res.status(200).json(order)
  //   }
  // })



exports.updteOrder = asyncHandler(async(req, res, next) => {
    const { timeRange } = req.body;

    let start, end;

    if (timeRange) {
        // Convert the timeRange to Date objects
        start = moment(timeRange.start, 'hh:mm A').toDate();
        end = moment(timeRange.end, 'hh:mm A').toDate();
    }

    const order = await orderSchema.findByIdAndUpdate(req.params.orderId, {
        date: req.body.date,
        timeRange: timeRange ? { start, end } : undefined, // Update only if timeRange is provided
        totalPrice: req.body.totalPrice,
        duration: req.body.duration,
        paymentMethod: req.body.paymentMethod,
        isPaid: req.body.isPaid,
        status: req.body.status
    }, { new: true });

    if (!order) {
        return next(new ApiError(`Could not find any order with this ID: ${req.params.orderId}`, 404));
    } else {
        res.status(200).json(order);
    }
});


















           

          
