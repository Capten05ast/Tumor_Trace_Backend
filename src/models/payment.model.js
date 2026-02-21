

const mongoose = require('mongoose');

// Payment Schema
const paymentSchema = new mongoose.Schema(
  {
    // User reference - CHANGED TO STRING to accept user?.id
    userId: {
      type: String, // ✅ CHANGED from ObjectId to String
      required: true,
      index: true
    },

    // File reference
    fileId: {
      type: String,
      required: true,
      index: true
    },

    // Razorpay payment details
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    razorpaySignature: {
      type: String,
      required: true
    },

    // Payment amount
    amount: {
      type: Number,
      required: false, // ✅ Made optional
      default: 111 // Default amount in rupees
    },

    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },

    // Refund details (optional)
    refundId: {
      type: String
    },

    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full'],
      default: 'none'
    },

    // Transaction details
    method: {
      type: String,
      enum: ['card', 'netbanking', 'wallet', 'upi'],
      required: false
    },

    bank: String,
    cardNetwork: String,
    cardLastFour: String,

    // Description
    description: {
      type: String,
      default: 'Tumor Classification Analysis'
    },

    notes: {
      type: mongoose.Schema.Types.Mixed
    },

    // Email and contact (optional)
    email: String,
    contact: String,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: Date
  },
  {
    timestamps: false // We manage createdAt and updatedAt manually
  }
);

// Create indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ paymentStatus: 1, createdAt: -1 });
paymentSchema.index({ fileId: 1, createdAt: -1 });

// Classification Schema
const classificationSchema = new mongoose.Schema(
  {
    // User reference - CHANGED TO STRING
    userId: {
      type: String, // ✅ CHANGED from ObjectId to String
      required: true,
      index: true
    },

    // File reference
    fileId: {
      type: String,
      required: true,
      index: true // ✅ REMOVED unique constraint - multiple classifications per file possible
    },

    // Payment reference - CHANGED TO STRING (razorpay payment ID)
    paymentId: {
      type: String, // ✅ CHANGED from ObjectId to String (Razorpay payment ID)
      required: true,
      index: true
    },

    razorpayPaymentId: {
      type: String,
      required: false, // ✅ Made optional since paymentId already stores this
      index: true
    },

    // Patient information
    age: {
      type: Number,
      required: false, // ✅ Made optional in case not provided
      min: 0,
      max: 150
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false, // ✅ Made optional
      lowercase: true // ✅ Auto-convert to lowercase
    },

    // Tumor classification results
    tumorType: {
      type: String,
      enum: ['Benign', 'Malignant'],
      required: true,
      index: true
    },

    confidence: {
      type: Number,
      required: false, // ✅ Made optional
      min: 0,
      max: 1,
      default: 0
    },

    confidencePercentage: {
      type: Number,
      required: false, // ✅ Made optional
      min: 0,
      max: 100,
      default: 0
    },

    // All prediction results
    allPredictions: [
      {
        className: String,
        probability: {
          type: Number,
          min: 0,
          max: 1
        }
      }
    ],

    // Top prediction
    topPrediction: {
      className: String,
      probability: {
        type: Number,
        min: 0,
        max: 1
      }
    },

    // Payment amount charged
    amountChargedInINR: {
      type: Number,
      default: 111
    },

    // Status
    status: {
      type: String,
      enum: ['completed', 'archived', 'disputed'],
      default: 'completed',
      index: true
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Create indexes
classificationSchema.index({ userId: 1, createdAt: -1 });
classificationSchema.index({ tumorType: 1, createdAt: -1 });
classificationSchema.index({ fileId: 1, createdAt: -1 });

// Export models
const Payment = mongoose.model('Payment', paymentSchema);
const Classification = mongoose.model('Classification', classificationSchema);

module.exports = { Payment, Classification };





