const {adminProtect, allowedTo} = require("../controllers/authContollers")
const { addToWallet , getAttendanceOfCurrentDate ,addNewDriverOrSubOwner ,
          login , addNewGarage,uploadGarageImages ,resizeImage ,updateSpecificGarage , deleteSpecificGarageData , 
          getAllAdmin , updataAdminData , removeSpecificAdmin} = require("../controllers/ownerControllers")
const {addNewDriverOrSubOwnerValidatot ,addNewGarageValidator} = require("../utils/validator/ownerValidator")
const {loginValidator} = require("../utils/validator/authValidator")

const router = require("express").Router();



router.post("/addToWallet/:userId",addToWallet)
router.get("/getAttendanceOfCurrentDate",getAttendanceOfCurrentDate)
router.post("/addNewDriverOrSubOwner",addNewDriverOrSubOwnerValidatot,addNewDriverOrSubOwner)
router.post("/login",loginValidator,login)
router.post("/addNewGarage",uploadGarageImages,resizeImage,addNewGarageValidator, addNewGarage)
router.put("/updateSpecificGarage/:garageId",uploadGarageImages,resizeImage,updateSpecificGarage)
router.delete("/deleteSpecificGarageData/:garageId" ,deleteSpecificGarageData)
router.get("/getAllAdmin",getAllAdmin)
router.put("/updataAdminData/:adminId",updataAdminData)
router.delete("/removeSpecificAdmin/:adminId",removeSpecificAdmin)



module.exports = router;

