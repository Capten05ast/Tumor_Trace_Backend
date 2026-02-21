


const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authUser(req, res, next) {
    try {
        // ✅ First, try to get token from Authorization header (for Google OAuth)
        let token = null;
        
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7); // Remove "Bearer " prefix
            console.log('✅ Token from Authorization header');
        }
        // ✅ If no Authorization header, try cookies (for regular login)
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log('✅ Token from cookie');
        }

        // ✅ If no token found, return 401
        if (!token) {
            console.log('❌ No token found');
            return res.status(401).json({
                message: "Unauthorized access - No token provided"
            });
        }

        // ✅ Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ Token verified, user ID:', decoded.id);
        
        // ✅ Find user in database
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // ✅ Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired. Please login again."
            });
        }
        
        return res.status(401).json({
            message: "Unauthorized access"
        });
    }
}

module.exports = {
    authUser
};





