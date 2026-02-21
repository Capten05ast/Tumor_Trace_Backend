


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const crypto = require('crypto');

async function registerUser(req, res) {
    try {
        const { username, email, password, age } = req.body;

        const isUserAlreadyExists = await userModel.findOne({ email });
        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "User already exists. Please login"
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hashPassword,
            age,
            nanoid: crypto.randomUUID()
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: "User registered successfully",
            token, // ✅ IMPORTANT: Return token for Google OAuth
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                age: user.age,
                nanoid: user.nanoid
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
}


async function loginUser(req, res) {
    try {
        console.log("📥 Login attempt:", req.body);
        
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            console.log("❌ User not found:", email);
            return res.status(400).json({
                message: "User does not exist. Please register"
            });
        }

        console.log("🔍 Comparing passwords...");
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        
        console.log("🔐 Password match:", isPasswordCorrect);
        
        if (!isPasswordCorrect) {
            console.log("❌ Invalid password for:", email);
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log("✅ Login successful for:", email);

        res.status(200).json({
            message: "User logged in successfully",
            token, // ✅ IMPORTANT: Return token for frontend
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                age: user.age,
                nanoid: user.nanoid
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
}


async function logoutUser(req, res) {
    res.clearCookie("token");
    res.status(200).json({
        message: "User logged out successfully"
    })
}


async function deleteUser(req, res) {
  try {
    await userModel.findByIdAndDelete(req.user._id);

    res.clearCookie("token");
    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


async function updateUser(req, res) {
  try {
    const { username, email, password } = req.body;

    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        age: updatedUser.age,
        nanoid: updatedUser.nanoid
      }
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


async function getCurrentUser(req, res) {
  try {
    // ✅ req.user is set by authUser middleware
    const user = await userModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        age: user.age,
        nanoid: user.nanoid,
        images: user.images // ✅ Include images with predictions
      }
    });

  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
    loginUser,
    registerUser,
    logoutUser,
    deleteUser,
    updateUser,
    getCurrentUser
}