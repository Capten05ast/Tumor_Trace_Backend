

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// ✅ Upload function that the controller uses
const uploadFile = async (file) => {
  try {
    console.log("🔧 Starting ImageKit upload...");
    console.log("File:", file.originalname, "Size:", file.size);

    // Upload to ImageKit
    const response = await imagekit.upload({
      file: file.buffer, // ← multer gives us buffer
      fileName: file.originalname,
      folder: "/xray-scans" // Optional: organize in folders
    });

    console.log("✅ ImageKit response:", {
      fileId: response.fileId,
      url: response.url,
      name: response.name
    });

    return {
      fileId: response.fileId, // ← Use this as unique ID
      url: response.url // ← This is the public URL
    };

  } catch (error) {
    console.error("❌ ImageKit upload error:", error.message);
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

module.exports = uploadFile;



