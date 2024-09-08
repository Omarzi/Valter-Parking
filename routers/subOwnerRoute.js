// const{getAttendance   } = require("../controllers/subOwnersControllers");
const{getAllOrders} = require("../controllers/userContoller");


const {adminProtect , allowedTo} = require("../controllers/authContollers")

const router = require("express").Router();

// router.get("/getAttendanceOfCurrentDate",adminProtect,allowedTo('SubOwner'),getAttendance)

router.get("/getAllOrdersForSpecificTime",adminProtect,allowedTo('SubOwner'),getAllOrders)



module.exports = router