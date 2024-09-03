const validatorMiddleware = require("../../middleware/validationMiddleware");
const ApiError = require("../../utils/apiError");
const userSchema = require("../../models/authModel");
const orderSchema = require("../../models/oderModel")
const { check } = require("express-validator");
const bcrypt = require("bcrypt")

exports.getProfileValidator = [
    check("userId")
      .notEmpty()
      .withMessage("userId is required"),

      validatorMiddleware,  
],

exports.updateProfileValidator = [
    check('userId')
       .isMongoId()
       .withMessage("Invalid Users id format")
       .optional(),

    check("email")  
       .isEmail()
       .withMessage("This email is invalid") 
       .optional(),

    check("phone")  
       .isMobilePhone(['ar-EG','ar-KW'])
       .withMessage("Invalid phone number only accept EG and SA phone number")
       .optional()  ,

       validatorMiddleware

],

exports.updatePasswordValidator = [

check("userId")
    .isMongoId()
    .withMessage("Invalid user id format"),

check("currentPassword")
    .notEmpty()
    .withMessage("You must enter current password"),

check("confirmPassword")
    .notEmpty() 
    .withMessage("You must enter confirm password") ,   

check("newPassword")
    .notEmpty()
    .withMessage("You must enter password") 
    .isLength({ min: 6 })
    .withMessage("Must be at least 6 characters")
    .custom(async(newPassword,{req})=>{

        // 1) Verify current password //
        const user = await userSchema.findById(req.params.userId)

        const isCorrectPassword =await bcrypt.compare(
            req.body.currentPassword,user.password
        )
        if(!isCorrectPassword){
            throw new Error("Inccorect current password")
        }

        // 2) Verify confirm password //

        if(newPassword !=req.body.confirmPassword){
            throw new Error("Password Does not Match")
        }
        return true;
        
    }) ,

    validatorMiddleware,


],

function formatTime12Hour(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert hour '0' to '12' in 12-hour format
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  
    return `${hours}:${formattedMinutes} ${ampm}`;
  }
  


//  check("timeRange")

//     .custom(async(val,{req})=>{
//         const start = await orderSchema.findOne({timeRanges : req.body.timeRange.start})
//         const end = await orderSchema.findOne({timeRanges : req.body.timeRange.end})


//         if(start&&end){
//          throw new Error("This timeRange is already booked.")
//         }
//         return true
//        }),,
// exports.makeOrderValidate = [
//     check("typeOfCar")
//       .notEmpty()
//       .withMessage("typeOfCar is required"),
  
//     check("garage")
//       .notEmpty()
//       .withMessage("garageId is required"),
  
//     check("date")
//       .notEmpty()
//       .withMessage("date is required"),
  
  
  
    
//  check("duration")
//     .notEmpty()
//     .withMessage("duration is required"),   
  
//  check("totalPrice")
//     .notEmpty()
//     .withMessage("totalPrice is required"), 
    
//     check("paymentMethod")
//     .notEmpty()
//     .withMessage("paymentMethod is required"),

//     check("timeLeft")
//     .optional(),  
   

//    validatorMiddleware,
// ]



exports.makeOrderValidate = [
  check("typeOfCar")
    .notEmpty()
    .withMessage("typeOfCar is required"),

  check("garage")
    .notEmpty()
    .withMessage("garageId is required"),

  check("date")
    .notEmpty()
    .withMessage("date is required"),

  check("timeRange")
     .custom(async(val,{req})=>{
        const start = await orderSchema.findOne({timeRanges : req.body.timeRange.start})
        const end = await orderSchema.findOne({timeRanges : req.body.timeRange.end})


        if(start&&end){
         throw new Error("This timeRange is already booked.")
        }
        return true
       }),


  check("duration")
    .notEmpty()
    .withMessage("duration is required"),

  check("totalPrice")
    .notEmpty()
    .withMessage("totalPrice is required"),

  check("paymentMethod")
    .notEmpty()
    .withMessage("paymentMethod is required"),

  check("timeLeft")
    .optional(),

  validatorMiddleware,
];
