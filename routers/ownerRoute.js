const {adminProtect, allowedTo} = require("../controllers/authContollers")
const { addToWallet , getAttendanceOfCurrentDate ,addNewDriverOrSubOwner ,
          login , addNewGarage,uploadGrageImages  ,updateSpecificGarage , deleteSpecificGarageData , 
          getAllAdmin , updataAdminData , removeSpecificAdmin} = require("../controllers/ownerControllers")
const {addNewDriverOrSubOwnerValidatot ,addNewGarageValidator} = require("../utils/validator/ownerValidator")
const {loginValidator} = require("../utils/validator/authValidator")

const router = require("express").Router();



router.post("/addToWallet/:userId",adminProtect,allowedTo('Owner'),addToWallet)
router.get("/getAttendanceOfCurrentDate",adminProtect,allowedTo('Owner'),getAttendanceOfCurrentDate)
router.post("/addNewDriverOrSubOwner",adminProtect,addNewDriverOrSubOwnerValidatot,addNewDriverOrSubOwner)
router.post("/login",loginValidator,login)
router.post("/addNewGarage",adminProtect,allowedTo('Owner'),uploadGrageImages,addNewGarageValidator, addNewGarage)
router.put("/updateSpecificGarage/:garageId",adminProtect,allowedTo('Owner'),uploadGrageImages,updateSpecificGarage)
router.delete("/deleteSpecificGarageData/:garageId" , adminProtect,allowedTo('Owner'),deleteSpecificGarageData)
router.get("/getAllAdmin",adminProtect,allowedTo('Owner'),getAllAdmin)
router.put("/updataAdminData/:adminId",adminProtect,allowedTo('Owner'),updataAdminData)
router.delete("/removeSpecificAdmin/:adminId" , adminProtect,allowedTo('Owner'),removeSpecificAdmin)



module.exports = router;

