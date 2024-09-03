
const {getProfile , updateProfile , updatePassword  , getAllGarages ,getSpecificGarage , makeOrder , getOrder ,getAllOrders , cancelOrder , getUserWallet } = require("../controllers/userContoller")
const {getProfileValidator , updateProfileValidator , updatePasswordValidator } = require("../utils/validator/userValidator")
const {protect , allowedTo} = require("../controllers/authContollers")
const {uploadAuthImage }= require("../controllers/authContollers")
const {addGarageToSaved , getUserSavedGarage , removeGarageFromSaved} = require("../controllers/savedControllers")

const router = require("express").Router();

router.get("/getProfile/:userId",protect,getProfileValidator, getProfile);
router.put("/updateProfile/:userId",protect,allowedTo('user'),uploadAuthImage,updateProfileValidator,updateProfile);
router.put("/updatePassword/:userId" ,protect,allowedTo('user'),updatePasswordValidator, updatePassword)
router.get("/getAllGarages",protect,getAllGarages)
router.get("/getSpecificGarage/:garageId",protect,getSpecificGarage)
router.post("/addGarageToSaved",protect,allowedTo('user'),addGarageToSaved)
router.get("/getUserSavedGarage",protect,allowedTo('user'),getUserSavedGarage)
router.delete("/removeGarageFromSaved" ,protect,allowedTo('user'), removeGarageFromSaved)
router.post("/makeOrder/:userId",allowedTo('user','Driver'),protect, makeOrder)
router.get("/getOrder/:orderId",protect,allowedTo('user','Driver'),getOrder)
router.get("/getAllOrders",protect,getAllOrders)
router.put("/cancelOrder/:orderId" ,protect,allowedTo('user'), cancelOrder)
router.get("/getUserWallet/:userId",protect,allowedTo('user'),getUserWallet)





module.exports = router;