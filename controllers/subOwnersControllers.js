const asyncHandler = require("express-async-handler");
const attendnceSchema = require("../models/attendanceModel")
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFetures")
const adminSchema = require("../models/adminModel")





  exports.getAttendance = asyncHandler(async(req,res)=> {

    let filter = {};
    if(req.filterObject) {filter=req.filterObject}
    // Build query
  
     //ApiFeatures(queryString , mongooseQuery)
    const apiFeatures = new ApiFeatures(req.query,attendnceSchema
      .find(filter))
      .filter()
        
  
     //Execute query
     const{mongooseQuery,paginationResult} = apiFeatures
     const attend = await mongooseQuery
     if(attend){    
         res.status(200).json({ paginationResult, attend : attend})
     }
     else {
         res.status(404).json({message:"not found attend"})
     }
  
  
  
  })   


 //            Login Middleware of driver and subowner          //
  



  

  





