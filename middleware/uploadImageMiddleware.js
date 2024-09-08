const multer = require("multer")
const ApiError = require("../utils/apiError")

exports.uploadMixOfImage = (FieldName)=> {
    const multerStorage = multer.memoryStorage()

    const multerFilter = function(req,res,cb) {
        if(File.mimetype.statWith('image')){
             cb(null , true)
        }

        else{
            cb(new ApiError(`Only images allowed` , 404),false)
        }
    }

    const upload = multer({storage: multerStorage , fileFilter: multerFilter})
    return upload.array(FieldName,'5');
}




// Middleware to handle single image upload
exports.uploadSingleImage = (FieldName) => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only images are allowed', 404), false);
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
  return upload.single(FieldName);
};
  