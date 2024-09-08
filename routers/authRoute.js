const { signUp , login , uploadAuthImage ,resizeImage,forgotPassword , verifyResetCode , resetPassword , allowedTo} = require("../controllers/authContollers");
const {signupValidator , loginValidator , resetPasswordValidator} = require("../utils/validator/authValidator")


const router = require("express").Router();

router.post("/signUp" ,uploadAuthImage,resizeImage,signupValidator, signUp);
router.post("/login" ,loginValidator, login);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyResetCode", verifyResetCode);
router.put("/resetPassword", resetPasswordValidator ,resetPassword);


module.exports = router;