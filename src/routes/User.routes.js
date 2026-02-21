

const express = require('express');
const router = express.Router();

const User = require("../controllers/User.controller");
const { authUser } = require("../middlewares/auth.middleware");

// ✅ GET CURRENT USER (with images) - Works with both cookies and Bearer tokens
router.get("/user/current", authUser, User.getCurrentUser);

// ✅ LOGIN USER
router.post("/user/login", User.loginUser);

// ✅ REGISTER USER
router.post("/user/register", User.registerUser);

// ✅ LOGOUT USER
router.post("/user/logout", authUser, User.logoutUser);

// ✅ DELETE USER
router.delete("/user/delete", authUser, User.deleteUser);

// ✅ UPDATE USER
router.put("/user/update", authUser, User.updateUser);

module.exports = router;


