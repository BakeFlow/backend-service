const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

/**
 * Processes and uploads an image file to a specified subfolder.
 *
 * Validates the image's MIME type and size, saves it as a JPEG file with a unique filename,
 * and returns a public URL to access the uploaded image.
 *
 * @async
 * @param {Object} reqFile - The file object from the request (e.g., from multer).
 * @param {Buffer} reqFile.buffer - The image file buffer.
 * @param {string} reqFile.mimetype - The MIME type of the image.
 * @param {number} reqFile.size - The size of the image in bytes.
 * @param {string} uploadSubfolder - The subfolder within the upload root where the image will be stored.
 * @returns {Promise<Object>} An object containing the upload result:
 *   - {boolean} success - Whether the upload was successful.
 *   - {string} message - A message describing the result.
 *   - {Object} [data] - If successful, contains:
 *       - {string} imageLink - The public URL to the uploaded image.
 */
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

/**
 * Processes the upload of multiple image files to a specified subfolder.
 *
 * @async
 * @param {Array<Object>} files - An array of file objects to be uploaded.
 * @param {string} uploadSubfolder - The subfolder path where images should be uploaded.
 * @returns {Promise<Object>} An object indicating the success status, a message, and data containing arrays of uploaded image links and failed upload messages if any.
 */
const processMultipleImageUploads = async (files, uploadSubfolder) => {
  const results = [];

  for (const file of files) {
    const result = await processImageUpload(file, uploadSubfolder);
    results.push(result);
  }

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    return {
      success: false,
      message: "Some images failed to upload.",
      data: {
        uploaded: results.filter((r) => r.success).map((r) => r.data.imageLink),
        failed: failed.map((r) => r.message),
      },
    };
  }

  return {
    success: true,
    message: "All images uploaded successfully.",
    data: {
      uploaded: results.map((r) => r.data.imageLink),
    },
  };
};

module.exports = {
  processImageUpload,
  processMultipleImageUploads,
};
