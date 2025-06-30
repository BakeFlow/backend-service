const express = require("express");
const router = express.Router();

const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require("./controllers/category.controller");

const upload = require("../../core/configs/multer.config");

// Route to create a new category
router.post("/category", upload.single("image"), createCategory);
// Route to get all categories
router.get("/categories", getAllCategories);
// Route to get a category by ID
router.get("/category/:id", getCategoryById);
// Route to update a category
router.put("/category/:id", upload.single("image"), updateCategory);
// Route to delete a category
router.delete("/category/:id", deleteCategory);

module.exports = router;
