const { signUp , login , uploadAuthImage ,resizeImage, forgotPassword , verifyResetCode , resetPassword , allowedTo} = require("../controllers/authContollers");
const {signupValidator , loginValidator , resetPasswordValidator} = require("../utils/validator/authValidator")


const router = require("express").Router();

router.post("/signUp" ,uploadAuthImage,resizeImage,signupValidator, signUp);
router.post("/login" ,loginValidator, login);
router.post("/forgotPassword",allowedTo('user'), forgotPassword);
router.post("/verifyResetCode",allowedTo('user'), verifyResetCode);
router.put("/resetPassword",allowedTo('user'), resetPasswordValidator ,resetPassword);


module.exports = router;