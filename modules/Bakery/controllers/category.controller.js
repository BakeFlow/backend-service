const sharp = require("sharp");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const Category = require("../../../models/category.model");

//create category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
      return res.status(400).json({ success: false, message: "Name and description are required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Please upload an image file" });
    }

    const { buffer, mimetype, size } = req.file;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const allowedSize = 3 * 1024 * 1024; // 1MB

    if (!mimetype.startsWith("image") || !allowedTypes.includes(mimetype)) {
      return res.status(400).json({ success: false, error: "Invalid image format. Only JPEG, PNG, and JPG are allowed." });
    }

    if (size > allowedSize) {
      return res.status(400).json({ success: false, error: "Image size should not exceed 1MB" });
    }

    // Save image using Sharp
    const baseURL = process.env.BASE_URL || "http://localhost:5000";
    const timestamp = Date.now();
    const uuid = uuidv4();
    const filename = `${uuid}_${timestamp}.jpeg`;

    const uploadFolder = process.env.UPLOAD_PATH || "./uploads";

    fs.access(uploadFolder, (error) => {
      if (error) fs.mkdirSync(uploadFolder);
    });

    await sharp(buffer).jpeg().toFile(`${uploadFolder}/${filename}`);
    const imageLink = `${baseURL}/api/assets/category/${filename}`;

    // Create new category
    const category = new Category({
      name,
      description,
      image: imageLink,
    });

    await category.save();

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get category by id
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
      return res.status(400).json({ success: false, message: "Name and description are required" });
    }

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // If an image is uploaded, process it
    let imageLink = existingCategory.image; // Keep existing image if no new image is uploaded
    if (req.file) {
      const { buffer, mimetype, size } = req.file;
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const allowedSize = 3 * 1024 * 1024; // 1MB

      if (!mimetype.startsWith("image") || !allowedTypes.includes(mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid image format. Only JPEG, PNG, and JPG are allowed." });
      }

      if (size > allowedSize) {
        return res.status(400).json({ success: false, error: "Image size should not exceed 1MB" });
      }

      // Save new image using Sharp
      const baseURL = process.env.BASE_URL || "http://localhost:5000";
      const timestamp = Date.now();
      const uuid = uuidv4();
      const filename = `${uuid}_${timestamp}.jpeg`;

      const uploadFolder = process.env.UPLOAD_PATH || "./uploads";

      fs.access(uploadFolder, (error) => {
        if (error) fs.mkdirSync(uploadFolder);
      });

      await sharp(buffer).jpeg().toFile(`${uploadFolder}/${filename}`);
      imageLink = `${baseURL}/api/assets/category/${filename}`;
    }

    const category = await Category.findByIdAndUpdate(id, { name, description, image: imageLink }, { new: true });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
