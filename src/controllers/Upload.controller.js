

const User = require("../models/user.model");
const uploadFile = require("../cloud/imageKit"); // Your ImageKit helper

exports.uploadFile = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ VALIDATION
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided"
      });
    }

    // ✅ STEP 1: Upload to ImageKit via backend
    console.log("📤 Uploading to ImageKit...");
    const uploadResult = await uploadFile(req.file);

    if (!uploadResult || !uploadResult.url || !uploadResult.fileId) {
      return res.status(500).json({
        success: false,
        message: "ImageKit upload failed"
      });
    }

    const { url: imageUrl, fileId } = uploadResult;
    console.log("✅ ImageKit upload success:", { imageUrl, fileId });

    // ✅ STEP 2: Save image metadata to MongoDB IMMEDIATELY (THIS IS KEY!)
    console.log("💾 Saving to MongoDB...");
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          images: {
            fileId,
            url: imageUrl,
            uploadedAt: new Date(),
            status: "uploaded", // Track state
            obj: {
              prediction: null,
              metadata: null,
              status: "pending"
            }
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("✅ Saved to MongoDB successfully");

    // ✅ STEP 3: Return to frontend with fileId for ML tracking
    return res.status(200).json({
      success: true,
      message: "Image uploaded and registered successfully",
      imageUrl,
      fileId, // ← Frontend MUST use this for ML dispatch
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { fileId } = req.body;
    const userId = req.user._id;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: "fileId required"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          images: { fileId }
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully"
    });

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message
    });
  }
};


