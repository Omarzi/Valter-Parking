const { activeGarage ,addNewUser ,
         takeAttendanceStartIn , takeAttendancesEndIn ,updteOrder  } = require("../controllers/driverControllers");
const {protect , allowedTo , adminProtect} = require("../controllers/authContollers")
const { addNewUserValidator , takeAttendanceValidator} = require("../utils/validator/driverValidator")
const {getAllOrders} = require("../controllers/userContoller")

const router = require("express").Router();



router.put("/activeGarage/:garageId",adminProtect,allowedTo('Driver'),activeGarage)
router.post("/addNewUser", adminProtect,allowedTo('Driver'),addNewUserValidator,addNewUser)
router.get("/getAllOrderBySpecificGarage",adminProtect,allowedTo('Driver'),getAllOrders)
router.put("/updteOrder/:orderId",adminProtect,allowedTo('Driver'),updteOrder)
router.post("/takeAttendanceStartIn", adminProtect,allowedTo('Driver'),takeAttendanceValidator,takeAttendanceStartIn)
router.post("/takeAttendancesEndIn", adminProtect,allowedTo('Driver'),takeAttendanceValidator,takeAttendancesEndIn)










module.exports = router;

