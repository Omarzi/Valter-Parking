const{getAttendance  } = require("../controllers/subOwnersControllers");
const{getAllOrders} = require("../controllers/userContoller");


const {protect , allowedTo} = require("../controllers/authContollers")

const router = require("express").Router();

router.get("/getAttendance",protect,allowedTo('SubOwner'),getAttendance)
router.get("/getAllOrdersForSpecificTime",protect,allowedTo('SubOwner'),getAllOrders)



module.exports = router