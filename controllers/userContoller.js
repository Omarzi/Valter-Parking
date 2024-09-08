const userSchema = require("../models/authModel")
const garageSchema = require("../models/garageModel")
const orderSchema = require("../models/oderModel")
const asyncHandler = require("express-async-handler")
const ApiError = require("../utils/apiError")
const bcrypt = require("bcrypt")
const QRCode = require('qrcode');
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware")
const jwt = require("jsonwebtoken")


exports.getProfile = asyncHandler(async(req , res , next) => {
    const {userId} = req.params
    const user = await userSchema.findById(userId).populate({
      path: 'saved',
      model: 'Garages',
      select: '-__v'
  });
    if(!user){
        return next (new ApiError(`could not found user by this id ${req.params.useId} `,404))
    }

    const formattedUser = {
      userId: user._id.toString(), 
      username: user.username,
      email: user.email,
      carName: user.carName,
      carNumber: user.carNumber,
      saved: user.saved,
      role: user.role,
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
            carname:req.body.carName,
            carnumber:req.body.carNumber,
            carImage:req.body.carImage,
            
        },{new : true}
    )
    if(!user){
        return next (new ApiError(`could not found user by this id ${req.params.useId} `,404))   
    }
    const formattedUser =         { 
      userId: user._id.toString(), 
      username:user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      carName:user.carName,
      carNumber:user.carNumber,
      carImage:user.carImage,
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt) ,
  }
    delete user._doc.password && delete user._doc.__v
    res.status(200).json(formattedUser)
})


exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await userSchema
    .findByIdAndUpdate(
      req.params.userId,
      {
        password: await bcrypt.hash(req.body.newPassword, 12),
        passwordChangedAt: Date.now(),
      },
      { new: true }
    )
    .populate({
      path: "saved",
      model: "Garages",
      select: "-__v",
    });

  if (!user) {
    return next(
      new ApiError(`could not find user by this id ${req.params.userId}`, 404)
    );
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRE_TIME }
  );

  const formattedUser = {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    carName: user.carName,
    carNumber: user.carNumber,
    carImage: user.carImage,
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  };
  
  // Sending the response as an object containing both user data and token
  res.status(200).json({
    status: "success",
    user: formattedUser,
    token: token,
  });
});


// exports.getAllGarages = asyncHandler(async (req, res, next) => {
//     // Check if the active query parameter is passed
//     const filter = req.query.active === 'true' ? { active: true } : {}; // Use {} to return all if no filter is provided

//     // Fetch garages based on the filter
//     const garages = await garageSchema.find(filter);

//     // Handle the case where no garages are found
//     if (!garages || garages.length === 0) {
//         return next(new ApiError("Could not find any garage", 404));
//     }
//     const formattedGarage =garages.map (garages=> ({
//       garageId: garages._id, // Format _id as a string
//       gragename: garages.gragename || '',
//       grageDescription: garages.grageDescription || '',
//       grageImages: garages.grageImages || '',
//       gragePricePerHoure: garages.gragePricePerHoure || 0,
//       lat: garages.lat || 0,
//       lng: garages.lng || 0,
//       openDate:formatDate(garages.createdAt),
//       endDate: formatDate(garages.updatedAt) ,/// Format ISO 8601
//       active: garages.active || false,
//       driver: garages.driver || [],
//       subOwner: garages.subOwner || [],
//       isSaved:garages.isSaved,
//       createdAt: formatDate(garages.createdAt),
//       updatedAt: formatDate(garages.updatedAt) // Format ISO 8601
  
//   }))
//     // Return the filtered or all garages
//     res.status(200).json({ "Garage Details": formattedGarage });
// });
 // Adjust the path as necessary

exports.getAllGarages = asyncHandler(async (req, res, next) => {
  // Check if the active query parameter is passed
  const filter = req.query.active === 'true' ? { active: true } : {}; // Use {} to return all if no filter is provided

  // Fetch garages based on the filter
  const garages = await garageSchema.find(filter);

  // Handle the case where no garages are found
  if (!garages || garages.length === 0) {
    return next(new ApiError("Could not find any garage", 404));
  }

  // Fetch the current user's saved garages using userId from the token
  const user = await userSchema.findById(req.user._id).populate('saved');
  if (!user) {
    return next(new ApiError('User not found', 404));
  }
  const savedGarageIds = user.saved.map(garage => garage._id.toString());

  // Helper function to format dates
 

  // Format the garages and check if each one is saved by the user
  const formattedGarages = garages.map(garage => ({
    garageId: garage._id.toString(), // Format _id as a string
    gragename: garage.gragename || '',
    grageDescription: garage.grageDescription || '',
    grageImages: garage.grageImages || '', // Assuming it's an array; adjust if needed
    gragePricePerHoure: garage.gragePricePerHoure || 0,
    lat: garage.lat || 0,
    lng: garage.lng || 0,
    openDate: formatDate(garage.openDate),
    endDate: formatDate(garage.endDate),
    active: garage.active || false,
    driver: garage.driver.map(id => id.toString()), // Ensure IDs are strings
    subOwner: garage.subOwner.map(id => id.toString()), // Ensure IDs are strings
    isSaved: savedGarageIds.includes(garage._id.toString()) ? true : false, // Convert boolean to string
    createdAt: formatDate(garage.createdAt),
    updatedAt: formatDate(garage.updatedAt) // Format ISO 8601
  }));

  // Return the filtered or all garages
  res.status(200).json({ "Garage Details": formattedGarages });
});





// exports.getSpecificGarage = asyncHandler(async( req , res , next) => {
//   const findGarage = await garageSchema.findById(req.params.garageId)
//   if(!findGarage) {
//       throw next(new ApiError(` This garage is not found` , 404))
//   }
//   else{
//     const formattedGarage = {
//       garageId: findGarage._id.toString(), // Format _id as a string
//       gragename: findGarage.gragename || '',
//       grageDescription: findGarage.grageDescription || '',
//       grageImages: findGarage.grageImages || '',
//       gragePricePerHoure: findGarage.gragePricePerHoure || 0,
//       lat: findGarage.lat || 0,
//       lng: findGarage.lng || 0,
//       openDate:formatDate(findGarage.createdAt),
//       endDate: formatDate(findGarage.updatedAt) ,/// Format ISO 8601
//       active: findGarage.active || false,
//       driver: findGarage.driver || [],
//       subOwner: findGarage.subOwner || [],
//       createdAt: formatDate(findGarage.createdAt),
//       updatedAt: formatDate(findGarage.updatedAt) // Format ISO 8601
  
//   }
//  res.status(200).json({findGarage: formattedGarage})
// }})
exports.getSpecificGarage = asyncHandler(async (req, res, next) => {
  // Ensure userId is available from the token middleware
  if (!req.user._id) {
    return next(new ApiError('User not authenticated', 401));
  }

  // Find the garage by ID
  const findGarage = await garageSchema.findById(req.params.garageId);
  if (!findGarage) {
    return next(new ApiError('This garage is not found', 404));
  }

  // Find the user and check if the garage is in the saved list
  const user = await userSchema.findById(req.user._id);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  const isSaved = user.saved.includes(findGarage._id);

  // Format the garage details
  const formattedGarage = {
    garageId: findGarage._id.toString(), // Format _id as a string
    gragename: findGarage.gragename || '',
    grageDescription: findGarage.grageDescription || '',
    grageImages: findGarage.grageImages || '',
    gragePricePerHoure: findGarage.gragePricePerHoure || 0,
    lat: findGarage.lat || 0,
    lng: findGarage.lng || 0,
    openDate: formatDate(findGarage.openDate),
    endDate: formatDate(findGarage.endDate), // Format ISO 8601
    active: findGarage.active || false,
    driver: findGarage.driver || [],
    subOwner: findGarage.subOwner || [],
    isSaved: isSaved ? true : false, // Set isSaved based on whether the garage is in the user's saved list
    createdAt: formatDate(findGarage.createdAt),
    updatedAt: formatDate(findGarage.updatedAt) // Format ISO 8601
  };

  // Send the response
  res.status(200).json({ findGarage: formattedGarage });
});



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
    const order = await orderSchema.findById(req.params.orderId).populate([
      {
        path: 'user',
        model: 'Users',
        select: '-__v '
      },
      {
        path: 'garage',
        model: 'Garages',
       select: '-__v '
      }
    ]);
    if(!order){
        throw next(new ApiError(` This order is not found` , 404))
    }
    else{
      const formattedOrder = {
        orderId: order._id.toString(),
        user: {
          userId: order.user._id.toString(),
          ...order.user.toObject(), // Include other user fields
          createdAt: formatDate(order.user.createdAt),
          updatedAt: formatDate(order.user.updatedAt)
        },
        garage: {
          garageId: order.garage._id.toString(),
          ...order.garage.toObject(), // Include other garage fields
          createdAt: formatDate(order.garage.createdAt),
          updatedAt: formatDate(order.garage.updatedAt)
        },
        typeOfCar: order.typeOfCar,
        date: order.date,
        timeRange: {
          start: order.timeRange.start,
          end: order.timeRange.end,
        },
        totalPrice: order.totalPrice,
        duration: order.duration,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        status: order.status,
        startNow: order.startNow,
        timeLeft: order.timeLeft,
        qrCode: order.qrCode,
        createdAt: formatDate(order.createdAt),
        updatedAt: formatDate(order.updatedAt)
      };
      delete formattedOrder.user._id;
      delete formattedOrder.garage._id;

   res.status(200).json( formattedOrder)
}})

//    Get All  Order  //


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
  const orders = await orderSchema.find(finalQuery).populate([
    {
      path: 'user',
      model: 'Users',
      select: '-__v '
    },
    {
      path: 'garage',
      model: 'Garages',
      select: '-__v '
    }
  ]);

  if (!orders || orders.length === 0) {

  res.status(200).json({ "order Details": [] });
  
  }

  // Helper function to format date
  const formatDate = (date) => moment(date).format('hh:mm A');

  // Format each order
  const formattedOrders = orders.map(order => {
      const formattedOrder = {
          orderId: order._id.toString(),
          user: order.user ? {
              userId: order.user._id.toString(),
              ...order.user.toObject(),
              createdAt: formatDate(order.user.createdAt),
              updatedAt: formatDate(order.user.updatedAt)
          } : null,
          garage: order.garage ? {
              garageId: order.garage._id.toString(),
              ...order.garage.toObject(),
              createdAt: formatDate(order.garage.createdAt),
              updatedAt: formatDate(order.garage.updatedAt)
          } : null,
          typeOfCar: order.typeOfCar,
          date: order.date,
          timeRange: order.timeRange ? {
              start: order.timeRange.start,
              end: order.timeRange.end,
          } : null,
          totalPrice: order.totalPrice,
          duration: order.duration,
          paymentMethod: order.paymentMethod,
          isPaid: order.isPaid,
          status: order.status,
          startNow: order.startNow,
          timeLeft: order.timeLeft,
          qrCode: order.qrCode,
          createdAt: formatDate(order.createdAt),
          updatedAt: formatDate(order.updatedAt)
      };

      // Remove _id from user and garage objects if they exist
      if (formattedOrder.user) delete formattedOrder.user._id;
      if (formattedOrder.garage) delete formattedOrder.garage._id;

      return formattedOrder;
  });

  // Send the formatted orders as the response
  res.status(200).json({ "order Details": formattedOrders });
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
  // exports.getUserWallet = asyncHandler(async(req , res , next) => {
  //   const user = await userSchema.findById(req.params.userId).populate('wallet')
  //   if(!user){
  //     return next (new ApiError(`could not found any user by this id ${req.params.userId} `,404))   

  //   }
  //   if(!user.wallet){
  //     // return next (new ApiError(`This user does not have wallet `,404))  
  //   res.status(200).json( {message:'This user does not have wallet'} );


  //   }
  //   res.status(200).json(  {data:user.wallet } );
  // })
  exports.getUserWallet = asyncHandler(async(req , res , next) => {
    const user = await userSchema.findById(req.params.userId).populate('wallet')
    if(!user){
      return next (new ApiError(`could not found any user by this id ${req.params.userId} `,404))   
  
    }
    if(!user.wallet){
      // return next (new ApiError( `This user does not have wallet `,404))  
    res.status(200).json( {message: 'This user does not have wallet'} );
  
  
    }
    res.status(200).json(  {message: 'This user have wallet', data:user.wallet } );
  });