const processImageUpload = require("../../../core/utils/file.upload.utils");
const Product = require("../../../models/product.model");

//create product
const createProduct = async (req, res) => {
  try {
    const { sellerId, name, categoryId, description, price, preparationTime, deliveryInfo, whatsAppNumber } = req.body;

    // Validate required fields
    if (!sellerId || !name || !categoryId || !description || !price || !preparationTime || !deliveryInfo || !whatsAppNumber) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (price < 0) {
      return res.status(400).json({ success: false, message: "Price must be a positive number." });
    }

    if (!/^\d{10}$/.test(whatsAppNumber)) {
      return res.status(400).json({ success: false, message: "WhatsApp number must be a valid 10-digit number." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required." });
    }

    const imageRes = await processImageUpload(req.file, "products");
    if (!imageRes.success) {
      return res.status(400).json({ success: false, message: imageRes.message });
    }
    const imageLink = imageRes.data.imageLink; // Use the processed image link

    const productData = {
      seller: sellerId,
      name,
      category: categoryId,
      description,
      price,
      preparationTime,
      image: imageLink, // Use the processed image link
      deliveryInfo,
      whatsAppNumber,
    };

    const product = await Product.create(productData);
    if (!product) {
      return res.status(500).json({ success: false, message: "Failed to create product." });
    }

    await product.populate("seller", "name email");
    await product.populate("category", "name");

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    //pagination
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);
    const products = await Product.find().skip(skip).limit(Number(limit)).populate("seller", "name email").populate("category", "name").sort({ createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found." });
    }

    return res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const product = await Product.findById(productId).populate("seller", "name email").populate("category", "name image");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get products by seller ID
const getProductsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required." });
    }

    const products = await Product.find({ seller: sellerId }).populate("category", "name image").sort({ createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found for this seller." });
    }

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products by seller ID:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Prepare update fields
    const allowedFields = ["name", "categoryId", "description", "price", "preparationTime", "deliveryInfo", "whatsAppNumber"];
    const updateFields = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }

    // Optional field validations
    if (updateFields.price !== undefined) {
      const price = parseFloat(updateFields.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ success: false, message: "Price must be a positive number." });
      }
      updateFields.price = price;
    }

    if (updateFields.whatsAppNumber !== undefined && !/^\d{10}$/.test(updateFields.whatsAppNumber)) {
      return res.status(400).json({ success: false, message: "WhatsApp number must be a valid 10-digit number." });
    }

    // Optional image update
    if (req.file) {
      const imageRes = await processImageUpload(req.file, "products");
      if (!imageRes.success) {
        return res.status(400).json({ success: false, message: imageRes.message });
      }
      updateFields.image = imageRes.data.imageLink; // Use the processed image link
    }

    // Apply updates
    Object.assign(product, updateFields);
    await product.save();

    await product.populate("seller", "name email");
    await product.populate("category", "name image");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsBySellerId,
  updateProduct,
  deleteProduct,
};
