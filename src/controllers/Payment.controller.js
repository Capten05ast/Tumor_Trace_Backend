

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Classification } = require('../models/payment.model');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Validation
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      });
    }

    console.log(`📦 Creating Razorpay order for amount: ${amount}`);

    // Create order options - KEEP RECEIPT SHORT!
    const options = {
      amount: amount, // Amount in paise (already multiplied by 100 on frontend)
      currency: currency,
      receipt: `TCD_${Date.now()}` // ✅ SHORT receipt (max 40 chars)
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created:', order.id);

    // Return order details to frontend
    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify Razorpay Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fileId, userId } = req.body;
    
    // ✅ TRY MULTIPLE WAYS TO GET userId
    let actualUserId = userId || req.user?.id || req.user?._id || req.body.userId;

    console.log('🔍 VERIFY PAYMENT DEBUG:');
    console.log('  razorpay_order_id:', razorpay_order_id);
    console.log('  razorpay_payment_id:', razorpay_payment_id);
    console.log('  razorpay_signature:', razorpay_signature ? 'Present' : 'Missing');
    console.log('  fileId:', fileId);
    console.log('  userId from body:', userId);
    console.log('  req.user:', req.user);
    console.log('  actualUserId:', actualUserId);

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details'
      });
    }

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'fileId is required'
      });
    }

    if (!actualUserId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    console.log('🔐 Verifying payment signature...');

    // Verify signature - THIS IS THE KEY PART
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature'
      });
    }

    console.log('✅ Signature verified successfully');

    // ✅ Payment is verified! Save to database WITH fileId and userId
    const payment = new Payment({
      userId: String(actualUserId), // ✅ Convert to string
      fileId: String(fileId),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'completed',
      amount: 111,
      currency: 'INR',
      completedAt: new Date()
    });

    await payment.save();

    console.log('✅ Payment saved to database successfully');
    console.log('✅ Payment document ID:', payment._id);

    res.status(200).json({
      success: true,
      message: '✅ Payment verified successfully!',
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Save Classification Results (ONLY AFTER VERIFIED PAYMENT)
exports.saveClassification = async (req, res) => {
  try {
    const {
      fileId,
      tumorType,
      confidence,
      allPredictions,
      paymentId,
      amount,
      age,
      gender,
      userId
    } = req.body;

    console.log('💾 SAVE CLASSIFICATION DEBUG:');
    console.log('  Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('  fileId:', fileId);
    console.log('  tumorType:', tumorType);
    console.log('  confidence:', confidence);
    console.log('  paymentId:', paymentId);
    console.log('  userId from body:', userId);
    console.log('  req.user:', req.user);
    console.log('  age:', age);
    console.log('  gender:', gender);
    console.log('  amount:', amount);

    // ✅ TRY MULTIPLE WAYS TO GET userId
    let actualUserId = userId || req.user?.id || req.user?._id || req.body.userId;

    console.log('  actualUserId:', actualUserId);

    // Validation
    if (!fileId) {
      console.error('❌ fileId is missing');
      return res.status(400).json({
        success: false,
        message: 'fileId is required'
      });
    }

    if (!tumorType) {
      console.error('❌ tumorType is missing');
      return res.status(400).json({
        success: false,
        message: 'tumorType is required'
      });
    }

    if (!paymentId) {
      console.error('❌ paymentId is missing');
      return res.status(400).json({
        success: false,
        message: 'paymentId is required'
      });
    }

    if (!actualUserId) {
      console.error('❌ userId is missing');
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    console.log(`💾 Saving classification for fileId: ${fileId}`);

    // Calculate confidence percentage
    const confidenceValue = confidence || 0;
    const confidencePercent = Math.round(confidenceValue * 100 * 100) / 100;

    // Find top prediction
    let topPrediction = null;
    if (allPredictions && allPredictions.length > 0) {
      topPrediction = allPredictions.reduce((max, pred) =>
        pred.probability > (max?.probability || 0) ? pred : max
      );
    }

    // Create classification record with userId
    const classificationData = {
      userId: String(actualUserId), // ✅ Convert to string
      fileId: String(fileId),
      paymentId: String(paymentId), // ✅ This is the Razorpay payment ID
      razorpayPaymentId: String(paymentId), // ✅ Same as paymentId
      tumorType: tumorType,
      confidence: confidenceValue,
      confidencePercentage: confidencePercent,
      allPredictions: allPredictions || [],
      topPrediction: topPrediction,
      age: age || null,
      gender: gender ? gender.toLowerCase() : null,
      amountChargedInINR: amount || 111,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Classification data to save:', JSON.stringify(classificationData, null, 2));

    const classification = new Classification(classificationData);

    const savedClassification = await classification.save();

    console.log('✅ Classification saved successfully');
    console.log('✅ Saved classification ID:', savedClassification._id);

    res.status(201).json({
      success: true,
      message: 'Classification saved successfully',
      data: {
        classificationId: savedClassification._id,
        fileId: savedClassification.fileId,
        tumorType: savedClassification.tumorType,
        confidence: savedClassification.confidencePercentage
      }
    });

  } catch (error) {
    console.error('❌ Error saving classification:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', JSON.stringify(error.errors, null, 2));
      
      // Extract validation error details
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        validationErrors: validationErrors
      });
    }

    // Check for duplicate key error
    if (error.code === 11000) {
      console.error('❌ Duplicate key error:', error.keyPattern);
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry - this classification may already exist',
        error: error.message,
        duplicateField: error.keyPattern
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save classification',
      error: error.message,
      errorDetails: error.stack
    });
  }
};


