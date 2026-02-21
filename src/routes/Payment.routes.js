

const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  saveClassification
} = require('../controllers/Payment.controller');

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a Razorpay order for classification payment
 * @access  Public (test mode)
 * @body    { amount, currency }
 * @returns { success, id, amount, currency }
 */
router.post('/create-order', createOrder);

/**
 * @route   POST /api/payment/verify-payment
 * @desc    Verify Razorpay payment signature
 * @access  Public (test mode)
 * @body    { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns { success, paymentId }
 */
router.post('/verify-payment', verifyPayment);

/**
 * @route   POST /api/payment/save-classification
 * @desc    Save classification results after successful payment
 * @access  Public (test mode)
 * @body    { fileId, tumorType, confidence, allPredictions, paymentId, amount, age, gender }
 * @returns { success, data }
 */
router.post('/save-classification', saveClassification);

module.exports = router;


