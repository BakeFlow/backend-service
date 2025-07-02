const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const processImageUpload = async (reqFile, uploadSubfolder) => {
  try {
    const { buffer, mimetype, size } = reqFile;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const allowedSize = 3 * 1024 * 1024; // 3MB

    if (!mimetype.startsWith("image") || !allowedTypes.includes(mimetype)) {
      throw new Error("Invalid image format. Only JPEG, PNG, and JPG are allowed.");
    }

    if (size > allowedSize) {
      throw new Error("Image size should not exceed 3MB.");
    }

    const uploadRoot = process.env.UPLOAD_PATH || "./uploads";
    const uploadFolder = path.join(uploadRoot, uploadSubfolder);

    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const timestamp = Date.now();
    const uuid = uuidv4();
    const filename = `${uuid}_${timestamp}.jpeg`;
    const fullPath = path.join(uploadFolder, filename);

    await sharp(buffer).jpeg().toFile(fullPath);

    // Return public URL based on known public structure
    const imageLink = `api/assets/${uploadSubfolder}/${filename}`;
    return { success: true, message: "Image uploaded successfully", data: { imageLink } };
  } catch (error) {
    console.error("Error processing image upload:", error);
    return { success: false, message: error.message || "Internal server error" };
  }
};

module.exports = processImageUpload;
