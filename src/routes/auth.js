



const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/user.model'); // ✅ Make sure path is correct
const crypto = require('crypto');

const router = express.Router();

// ✅ Simple ID generator (replaces nanoid)
const generateId = () => {
  return crypto.randomBytes(8).toString('hex');
};

// Configure Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://tumor-trace-backend.onrender.com/api/auth/google/callback',  // ✅ FIXED: Use full URL from env
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails?.[0]?.value || null,
    profilePicture: profile.photos?.[0]?.value || null,
  };
  return done(null, user);
}));

// Route 1: Initiate Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Route 2: Google Callback - Save/Update user in MongoDB
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const { id: googleId, displayName, email, profilePicture } = req.user;

      console.log('\n🔍 ===== GOOGLE AUTH DEBUG =====');
      console.log('📧 Google Email:', email);
      console.log('👤 Display Name:', displayName);
      console.log('🆔 Google ID:', googleId);

      // ✅ Check if user already exists in MongoDB
      console.log('🔎 Searching for existing user...');
      let user = await User.findOne({ email: email });

      if (!user) {
        // ✅ CREATE NEW USER if doesn't exist
        console.log('📝 User not found. Creating new user...');
        
        const generatedUsername = displayName.replace(/\s+/g, '').toLowerCase();
        const newUserData = {
          username: generatedUsername,
          email: email,
          password: `google_${googleId}`, // Google users don't have regular passwords
          age: 0, // User can update this later
          nanoid: generateId(),
          images: []
        };

        console.log('📋 New user data:', newUserData);

        try {
          user = await User.create(newUserData);
          console.log('✅ NEW USER CREATED:', user._id);
          console.log('📊 User document:', {
            _id: user._id,
            username: user.username,
            email: user.email,
            nanoid: user.nanoid
          });
        } catch (createError) {
          console.error('❌ ERROR CREATING USER:', createError.message);
          console.error('Full error:', createError);
          
          // If there's a validation error, log it
          if (createError.errors) {
            console.error('Validation errors:', createError.errors);
          }
          
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_creation_failed`);
        }
      } else {
        console.log('✅ EXISTING USER FOUND:', user._id);
        console.log('📊 User document:', {
          _id: user._id,
          username: user.username,
          email: user.email
        });
      }

      // Create JWT token with MongoDB user ID
      console.log('\n🔐 Creating JWT token...');
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token created');

      // User data to send to frontend
      const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        age: user.age,
        nanoid: user.nanoid
      };

      // Redirect to frontend with token and user data
      const redirectUrl = `${process.env.FRONTEND_URL}/?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      
      console.log('\n✅ REDIRECTING TO FRONTEND');
      console.log('🔗 Redirect URL:', redirectUrl.substring(0, 100) + '...');
      console.log('============================\n');
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('\n❌ GOOGLE CALLBACK ERROR:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('============================\n');
      
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// ✅ Optional: Error handling route
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google authentication failed'
  });
});

// ✅ EXPORT THE ROUTER
module.exports = router;


