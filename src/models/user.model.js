

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    nanoid: { type: String, required: true, unique: true },

    images: [
      {
        url: { type: String, required: true },
        fileId: { type: String, required: true },

        obj: {
          age: Number,
          gender: { type: String, enum: ["male", "female"] },
          imageUrl: String,

          prediction: {
            result: { type: String, enum: ["Tumor_Yes", "Tumor_No"] },
            confidence: Number,
            allPredictions: [
              {
                className: String,
                probability: Number,
              },
            ],
          },

          // ✅ NEW: Tumor Classification (Benign/Malignant)
          tumorClassification: {
            type: { type: String, enum: ["Benign", "Malignant"] },
            confidence: Number,
            allPredictions: [
              {
                className: String,
                probability: Number,
              },
            ],
            classifiedAt: Date,
          },

          metadata: {
            age: Number,
            gender: { type: String, enum: ["male", "female"] },
            analyzedAt: Date,
          },
          status: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;


