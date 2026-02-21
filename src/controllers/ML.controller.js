

const User = require("../models/user.model");

exports.saveMLResult = async (req, res) => {
  try {

    console.log("🔐 Auth Check:");
    console.log("Cookies:", req.cookies);
    console.log("Headers:", req.headers);
    console.log("req.user:", req.user);

    const { fileId, age, gender, imageUrl, prediction } = req.body;
    const userId = req.user._id;

    // ✅ VALIDATION
    if (!fileId || !prediction) {
      return res.status(400).json({
        success: false,
        message: "Missing fileId or prediction data"
      });
    }

    console.log("🔍 Looking for image with fileId:", fileId);

    // ✅ STEP 1 & 2 COMBINED: Use findOneAndUpdate with query that matches the array element
    // This way the $ operator knows which element to update
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        "images.fileId": fileId  // ✅ This query MUST be in findOneAndUpdate, not findByIdAndUpdate
      },
      {
        $set: {
          "images.$.obj.prediction": {
            result: prediction.result || "Unknown",
            confidence: prediction.confidence || 0,
            allPredictions: prediction.allPredictions || []
          },
          "images.$.obj.metadata": {
            age: parseInt(age) || null,
            gender: gender || null,
            analyzedAt: new Date()
          },
          "images.$.obj.status": "analyzed"
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log("❌ Image not found for fileId:", fileId);
      return res.status(404).json({
        success: false,
        message: `Image with fileId ${fileId} not found. Upload image first via /upload endpoint`
      });
    }

    console.log("✅ User updated successfully!");

    // ✅ STEP 3: Return success with updated prediction
    const updatedImage = updatedUser.images.find(img => img.fileId === fileId);

    console.log("📤 Prediction saved:", updatedImage?.obj?.prediction);

    return res.status(200).json({
      success: true,
      message: "ML analysis saved successfully",
      prediction: updatedImage?.obj?.prediction || null,
      metadata: updatedImage?.obj?.metadata || null
    });

  } catch (error) {
    console.error("❌ ML result error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save ML result",
      error: error.message
    });
  }
};


// ✅ NEW: Save Tumor Classification (Benign/Malignant)
exports.saveTumorClassification = async (req, res) => {
  try {

    console.log("🧬 Classification Request received");

    const { fileId, tumorType, confidence, allPredictions } = req.body;
    const userId = req.user._id;

    // ✅ VALIDATION
    if (!fileId || !tumorType) {
      return res.status(400).json({
        success: false,
        message: "Missing fileId or tumorType data"
      });
    }

    console.log("🔍 Looking for image with fileId:", fileId);
    console.log("Tumor Type:", tumorType, "Confidence:", confidence);

    // ✅ Use findOneAndUpdate to save classification
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        "images.fileId": fileId
      },
      {
        $set: {
          "images.$.obj.tumorClassification": {
            type: tumorType,  // "Benign" or "Malignant"
            confidence: confidence || 0,
            allPredictions: allPredictions || [],
            classifiedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log("❌ Image not found for fileId:", fileId);
      return res.status(404).json({
        success: false,
        message: `Image with fileId ${fileId} not found`
      });
    }

    console.log("✅ Tumor classification saved successfully!");

    // ✅ Return updated classification
    const updatedImage = updatedUser.images.find(img => img.fileId === fileId);

    console.log("📤 Classification saved:", updatedImage?.obj?.tumorClassification);

    return res.status(200).json({
      success: true,
      message: "Tumor classification saved successfully",
      tumorClassification: updatedImage?.obj?.tumorClassification || null
    });

  } catch (error) {
    console.error("❌ Classification save error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save tumor classification",
      error: error.message
    });
  }
};


