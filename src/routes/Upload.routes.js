


const express = require("express");
const Router = express.Router();
const { authUser } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer");
const uploadController = require("../controllers/Upload.controller");

Router.post(
    "/upload",
    authUser,                    // VERIFY USER AUTHENTICATION
    upload.single("image"),      // MULTER MIDDLEWARE TO HANDLE FILE UPLOAD (BECOZ MONGODB ONLY WOEKS WITH JSON DATA)
    uploadController.uploadFile  // UPLOAD TO IMAGEKIT AND SAVE IN MONGODB
);

Router.post(
    "/delete",
    authUser,
    uploadController.deleteImage
)

module.exports = Router;

// IN POSTMAN :
// body -> form-data -> key : image (type : file) -> choose file









