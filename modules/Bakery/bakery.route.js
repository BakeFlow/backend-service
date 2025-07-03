const express = require("express");
const router = express.Router();

const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require("./controllers/category.controller");
const { createSeller, getSellerByUserId, getSellerById, getAllSellers, updateSeller, addLogo } = require("./controllers/seller.controller");
const { createProduct, getAllProducts, getProductById, getProductsBySellerId, updateProduct, deleteProduct } = require("./controllers/product.controller");
const { createReview, getReviewsBySeller, getReviewsByUser, getAllReviews, getReviewById, updateReview, deleteReview } = require("./controllers/review.controller");

const upload = require("../../core/configs/multer.config");

//category routes
router.post("/category", upload.single("image"), createCategory);
router.get("/categories", getAllCategories);
router.get("/category/:id", getCategoryById);
router.put("/category/:id", upload.single("image"), updateCategory);
router.delete("/category/:id", deleteCategory);

//seller routes
router.post("/seller", upload.single("image"), createSeller);
router.get("/seller/user/:userId", getSellerByUserId);
router.get("/seller/:sellerId", getSellerById);
router.get("/sellers", getAllSellers);
router.put("/seller/:sellerId", upload.single("image"), updateSeller);
router.put("/seller/logo/:sellerId", upload.single("image"), addLogo);

//product routes
router.post("/product", upload.single("image"), createProduct);
router.get("/products", getAllProducts);
router.get("/product/:productId", getProductById);
router.get("/products/seller/:sellerId", getProductsBySellerId);
router.put("/product/:productId", upload.single("image"), updateProduct);
router.delete("/product/:productId", deleteProduct);

//review routes
router.post("/review/seller", upload.array("images", 5), createReview);
router.get("/reviews/seller/:sellerId", getReviewsBySeller);
router.get("/reviews/user/:userId", getReviewsByUser);
router.get("/reviews", getAllReviews);
router.get("/review/:reviewId", getReviewById);
router.put("/review/:reviewId", upload.array("images", 5), updateReview);
router.delete("/review/:reviewId", deleteReview);

module.exports = router;
