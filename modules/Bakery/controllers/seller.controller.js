const sharp = require("sharp");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const Seller = require("../models/seller.model");

const user_roles = require("../../../core/enums/user.roles.enum");

//create seller
const createSeller = async (req, res) => {
  try {
    // Extract seller data from request body
    const { userId, businessName, ownerName, description, location, address } = req.body;

    // Validate required fields
    if (!userId || !businessName || !ownerName || !description || !location || !address) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    //check user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    //check if user is already a seller
    if (userExists.role !== user_roles.SELLER) {
      return res.status(400).json({ success: false, message: "User is not a seller" });
    }

    //check if userId exists in the database
    const existingSeller = await Seller.findOne({ userId });
    if (existingSeller) {
      return res.status(400).json({ success: false, message: "Seller already exists for this user" });
    }

    // Create a new seller instance
    const newSeller = new Seller({
      user: userId,
      businessName,
      ownerName,
      description,
      location,
      address,
      logo: "",
    });

    await newSeller.save();

    res.status(201).json({ success: true, message: "Seller created successfully", data: newSeller });
  } catch (error) {
    console.error("Error creating seller:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

//get seller by userId
const getSellerByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find seller by userId
    const seller = await Seller.findOne({ user: userId }).populate("user", "name email");

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error("Error fetching seller:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

//get seller by id
const getSellerById = async (req, res) => {
  try {
    const { sellerId } = req.params;
    // Find seller by ID
    const seller = await Seller.findById(sellerId).populate("user", "name email");
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error("Error fetching seller by ID:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

//get all sellers
const getAllSellers = async (req, res) => {
  try {
    //paginate sellers
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const totalSellers = await Seller.countDocuments();
    const sellers = await Seller.find().skip(skip).limit(parseInt(limit)).populate("userId", "name email");

    res.status(200).json({
      success: true,
      data: sellers,
      meta: {
        total: totalSellers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalSellers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

//update seller
const updateSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const updateFields = {};

    // Collect only provided fields to update
    const allowedFields = ["businessName", "ownerName", "description", "location", "address"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // Handle image upload if present
    if (req.file) {
      const { buffer, mimetype, size } = req.file;
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const allowedSize = 3 * 1024 * 1024; // 3MB

      if (!mimetype.startsWith("image") || !allowedTypes.includes(mimetype)) {
        return res.status(400).json({ success: false, error: "Invalid image format. Only JPEG, PNG, and JPG are allowed." });
      }

      if (size > allowedSize) {
        return res.status(400).json({ success: false, error: "Image size should not exceed 3MB" });
      }

      // Save image using sharp
      const baseURL = process.env.BASE_URL || "http://localhost:5000";
      const uploadFolder = process.env.UPLOAD_PATH || "./uploads/sellers"; // use a folder like /uploads/sellers

      // Ensure folder exists
      if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
      }

      const timestamp = Date.now();
      const uuid = uuidv4();
      const filename = `${uuid}_${timestamp}.jpeg`;

      const fullPath = path.join(uploadFolder, filename);
      await sharp(buffer).jpeg().toFile(fullPath);

      // Construct accessible image URL
      const imageRelativePath = path.relative("./uploads", fullPath); // remove root upload path
      const imageLink = `${baseURL}/api/assets/${imageRelativePath.replace(/\\/g, "/")}`; // Normalize path

      // Add to update fields
      updateFields.logo = imageLink;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "At least one field is required to update" });
    }

    // Find the seller and update
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId, updateFields, { new: true, runValidators: true }).populate("user", "name email");

    if (!updatedSeller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    res.status(200).json({ success: true, message: "Seller updated successfully", data: updatedSeller });
  } catch (error) {
    console.error("Error updating seller:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

//add logo to seller
const addLogo = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Logo image is required" });
    }

    const { buffer, mimetype, size } = req.file;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const allowedSize = 3 * 1024 * 1024; // 3MB

    if (!mimetype.startsWith("image") || !allowedTypes.includes(mimetype)) {
      return res.status(400).json({ success: false, error: "Invalid image format. Only JPEG, PNG, and JPG are allowed." });
    }

    if (size > allowedSize) {
      return res.status(400).json({ success: false, error: "Image size should not exceed 3MB" });
    }

    // Save image using sharp
    const baseURL = process.env.BASE_URL || "http://localhost:5000";
    const uploadFolder = process.env.UPLOAD_PATH || "./uploads/sellers"; // use a folder like /uploads/sellers

    // Ensure folder exists
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const timestamp = Date.now();
    const uuid = uuidv4();
    const filename = `${uuid}_${timestamp}.jpeg`;

    const fullPath = path.join(uploadFolder, filename);
    await sharp(buffer).jpeg().toFile(fullPath);

    // Construct accessible image URL
    const imageRelativePath = path.relative("./uploads", fullPath); // remove root upload path
    const imageLink = `${baseURL}/api/assets/${imageRelativePath.replace(/\\/g, "/")}`; // Normalize path

    // Update seller with new logo
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId, { logo: imageLink }, { new: true }).populate("user", "name email");

    if (!updatedSeller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    res.status(200).json({ success: true, message: "Logo added successfully", data: updatedSeller });
  } catch (error) {
    console.error("Error adding logo:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

module.exports = {
  createSeller,
  getSellerByUserId,
  getSellerById,
  getAllSellers,
  updateSeller,
  addLogo,
};
