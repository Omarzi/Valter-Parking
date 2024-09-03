const userSchema = require("../models/authModel")
const garageSchema = require("../models/garageModel")
const orderSchema = require("../models/oderModel")
const asyncHandler = require("express-async-handler")
const ApiError = require("../utils/apiError")
const bcrypt = require("bcrypt")
const QRCode = require('qrcode');
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware")


exports.getProfile = asyncHandler(async(req , res , next) => {
    const {userId} = req.params
    const user = await userSchema.findById(userId)
    if(!user){
        return next (new ApiError(`could not found user by this id ${req.params.useId} `,404))
    }

    const formattedUser = {
      userId: user._id, 
      role: user.role,
      username: user.username,
      email: user.email,
      carname: user.carName,
      carnumber: user.carNumber,
      saved: user.saved,
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt) ,
      passwordChangedAt: formatDate(user.passwordChangedAt) ,
      wallet: user.wallet,
  };
    delete user._doc.password && delete user._doc.__v
    res.status(200).json(formattedUser)
})


exports.updateProfile = asyncHandler(async(req , res , next) => {
    const {userId} = req.params;
    const user = await userSchema.findByIdAndUpdate(userId , 
        { 
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            profileImage: req.body.profileImage,
            carname:req.body.carname,
            carnumber:req.body.carnumber,
            carImage:req.body.carImage
        },{new : true}
    )
    if(!user){
        return next (new ApiError(`could not found user by this id ${req.params.useId} `,404))   
    }

    delete user._doc.password && delete user._doc.__v
    res.status(200).json(user)
})


exports.updatePassword = asyncHandler(async (req, res , next) => {
    const user = await userSchema.findByIdAndUpdate(req.params.userId , {
        password: await bcrypt.hash(req.body.newPassword , 12),
        passwordChangedAt : Date.now()
    } , {new: true})

    if(!user){
        return next (new ApiError(`could not found user by this id ${req.params.useId} `,404))  
    }
    delete user._doc.password && delete user._doc.__v
    res.status(200).json(user)
})



exports.getAllGarages = asyncHandler(async (req, res, next) => {
    // Check if the active query parameter is passed
    const filter = req.query.active === 'true' ? { active: true } : {}; // Use {} to return all if no filter is provided

    // Fetch garages based on the filter
    const garages = await garageSchema.find(filter);

    // Handle the case where no garages are found
    if (!garages || garages.length === 0) {
        return next(new ApiError("Could not find any garage", 404));
    }

    // Return the filtered or all garages
    res.status(200).json({ "Garage Details": garages });
});





exports.getSpecificGarage = asyncHandler(async( req , res , next) => {
  const findGarage = await garageSchema.findById(req.params.garageId)
  if(!findGarage) {
      throw next(new ApiError(` This garage is not found` , 404))
  }
  else{
 res.status(200).json({findGarage: findGarage})
}})


   //  Make   Order   //

exports.makeOrder = asyncHandler(async (req, res, next) => {
  const { garage, typeOfCar, timeRange, totalPrice, paymentMethod, date, duration, isPaid, status, startNow } = req.body;

  // Parse start and end times from the hh:mm:ss am/pm format
  const startTime = moment(timeRange.start, 'hh:mm:ss A').toDate();  // Parse start time
  const endTime = moment(timeRange.end, 'hh:mm:ss A').toDate();      // Parse end time

  if (!startTime || !endTime) {
    return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
  }

  // Validate and check for overlapping orders if startNow is false
  if (startNow === false) {
    if (!duration || !timeRange) {
      return res.status(400).json({ message: 'Duration and TimeRange are required' });
    }

    const foundOrder = await orderSchema.findOne({
      user: req.params.userId,
      date,
      $and: [
        { "timeRange.start": { $lt: endTime, $gte: startTime } },
        { "timeRange.end": { $lte: endTime, $gt: startTime } },
        {
          $or: [
            { "timeRange.start": { $lte: startTime } },
            { "timeRange.end": { $gte: endTime } }
          ]
        }
      ]
    });

    if (foundOrder) {
      return next(new ApiError(`Order with this timeRange already exists for the user`, 409));
    }
  }

  // Calculate timeLeft
  let timeLeft;
  const now = Date.now();
  const startTimestamp = startTime.getTime();
  const endTimestamp = endTime.getTime();

  if (startTimestamp <= now) {
    timeLeft = endTimestamp - now;
  }

  // Create the new order
  const newOrderData = {
    user: req.params.userId,
    garage,
    typeOfCar,
    date,
    timeRange: {
      start: startTime,
      end: endTime
    },
    totalPrice,
    duration,
    paymentMethod,
    isPaid,
    status,
    startNow,
    timeLeft
  };

  // Handle wallet payment logic if paymentMethod is 'wallet'
  if (paymentMethod === 'wallet') {
    const user = await userSchema.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User or wallet not found' });
    }

    if (user.wallet < totalPrice || user.wallet === 0) {
      return res.status(400).json({ message: 'Sorry, you do not have enough money in your wallet' });
    }

    // Subtract the totalPrice from the wallet
    user.wallet -= totalPrice;
    await user.save();
  }

  // Generate the QR code based on userId and placeId (or garageId)
  const qrData = JSON.stringify({ userId: req.params.userId, garageId: req.body.garageId });

  try {
    // Generate the QR code as a data URL
    const qrImage = await QRCode.toDataURL(qrData);
    newOrderData.qrCode = qrImage;

    // Save the new order in the database
    const newOrder = await orderSchema.create(newOrderData);

    // Respond with the created order and the QR code image (base64)
    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return next(new ApiError(`Failed to generate QR code`, 500));
  }
});


  

  //     Get Specific  Order   //

  exports.getOrder = asyncHandler(async( req , res , next) => {
    const order = await orderSchema.findById(req.params.orderId)
    if(!order){
        throw next(new ApiError(` This order is not found` , 404))
    }
    else{
   res.status(200).json({Order : order})
}})

//    Get All  Order  //



// exports.getAllOrders = asyncHandler(async (req, res, next) => {
//     const change = req.query; 
  
//     const orders = await orderSchema.find(change);
  
//     if (!orders || orders.length === 0) {
//       return next(new ApiError("Could not find any order", 404));
//     } else {
   
//       orders.forEach(order => {
        
//         if (order.status === 'completed' || order.status === 'canceled') {
         
//           delete order._doc.isPaied;
//         }
//       });
  
//       res.status(200).json({ "order Details": orders });
//     }
//   });

exports.getAllOrders = asyncHandler(async (req, res, next) => {
  const { "timeRange.start": timeRangeStart, "timeRange.end": timeRangeEnd, ...query } = req.query;

  let timeRangeQuery = {};

  // Check if timeRangeStart and timeRangeEnd are provided
  if (timeRangeStart && timeRangeEnd) {
      // Parse the timeRangeStart and timeRangeEnd from the query string (hh:mm:ss am/pm format)
      const startTime = moment(timeRangeStart, 'hh:mm:ss A').toDate();
      const endTime = moment(timeRangeEnd, 'hh:mm:ss A').toDate();

      // Validate if parsing was successful
      if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
      }

      // Build the timeRange query using the parsed Date objects
      timeRangeQuery = {
          "timeRange.start": { $gte: startTime },
          "timeRange.end": { $lte: endTime }
      };
  }

  // Merge the timeRangeQuery with the other query params
  const finalQuery = { ...query, ...timeRangeQuery };

  // Find the orders based on the query
  const orders = await orderSchema.find(finalQuery);

  if (!orders || orders.length === 0) {
      return next(new ApiError("Could not find any order", 404));
  } else {
      orders.forEach(order => {
          if (order.status === 'completed' || order.status === 'canceled') {
              delete order._doc.isPaied;
          }
      });

      res.status(200).json({ "order Details": orders });
  }
});


  
  exports.cancelOrder = asyncHandler(async(req, res, next) => {
    const foundOrder  = await orderSchema.findById(req.params.orderId)
    if(!foundOrder){
      return next (new ApiError(`could not found any order by this id ${req.params.orderId} `,404))   

  }
  else {
    if(foundOrder.timeRange.start<Date.now()){
      const order = await orderSchema.findByIdAndUpdate(req.params.orderId , {

        status: 'canceled'
    } , {new : true})
 
        res.status(200).json(order)
    }
    else {
      return next (new ApiError(`Sory, could not cancle this order `,404))   

    }
  }


    
  })

           //  Get User wallet // 
  exports.getUserWallet = asyncHandler(async(req , res , next) => {
    const user = await userSchema.findById(req.params.userId).populate('wallet')
    if(!user){
      return next (new ApiError(`could not found any user by this id ${req.params.userId} `,404))   

    }
    res.status(200).json(  {data:user.wallet } );
  })
