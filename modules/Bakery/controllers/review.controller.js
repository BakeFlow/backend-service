const { processMultipleImageUploads } = require("../../../core/utils/file.upload.utils");
const Review = require("../../../models/review.model");
const Seller = require("../../../models/seller.model");
const User = require("../../../models/user.model");

//create review
const createReview = async (req, res) => {
  try {
    const { sellerId, userId, rating, comment } = req.body;

    if (!rating || !comment || !sellerId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    let images = [];
    if (req.files?.length > 0) {
      const imagesRes = await processMultipleImageUploads(req.files, "reviews");
      if (!imagesRes.success) {
        return res.status(400).json({ success: false, message: imagesRes.message });
      }
      images = imagesRes.data.uploaded;
    }

    const review = new Review({
      user: userId,
      seller: sellerId,
      rating,
      comment,
      images,
    });

    await review.save();

    // await Seller.findByIdAndUpdate(sellerId, {
    //   $push: { reviews: review._id },
    //   $inc: { totalRating: rating, reviewCount: 1 },
    // });

    const populatedReview = await Review.findById(review._id).populate("user", "name email").populate("seller", "businessName ownerName");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: populatedReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

const getReviewsBySeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    // Validate sellerId
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }

    // Check if seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // Fetch reviews for the seller
    const reviews = await Review.find({ seller: sellerId }).populate("user", "name email").sort({ createdAt: -1 }); // Sort by most recent first

    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: "No reviews found for this seller" });
    }

    //calculate average rating
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    //calculate 5 , 4 , 3 , 2 , 1 star rating percentage
    const starRatings = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review) => review.rating === star).length;
      return {
        star,
        count,
        percentage: totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(2) : 0,
      };
    });

    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews,
      meta: {
        totalReviews,
        averageRating,
        starRatings,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get all reviews by user
const getReviewsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Fetch reviews by user
    const reviews = await Review.find({ user: userId }).populate("seller", "businessName ownerName").sort({ createdAt: -1 });

    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: "No reviews found for this user" });
    }

    res.status(200).json({ success: true, message: "Reviews fetched successfully", data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//get all reviews
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const totalReviews = await Review.countDocuments();
    const totalPages = Math.ceil(totalReviews / limit);
    const reviews = await Review.find().populate("user", "name email").populate("seller", "businessName ownerName").sort({ createdAt: -1 }).skip(skip).limit(limit);
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: "No reviews found" });
    }

    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews,
      meta: {
        totalReviews,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//get review by id
const getReviewById = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    // Validate reviewId
    if (!reviewId) {
      return res.status(400).json({ success: false, message: "Review ID is required" });
    }

    // Fetch review by ID
    const review = await Review.findById(reviewId).populate("user", "name email").populate("seller", "businessName ownerName");

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.status(200).json({ success: true, message: "Review fetched successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//update review
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Update images if provided
    if (req.files && req.files.length > 0) {
      const imagesRes = await processMultipleImageUploads(req.files, "reviews");
      if (!imagesRes.success) {
        return res.status(400).json({ success: false, message: imagesRes.message });
      }
      review.images = imagesRes.data.uploaded;
    }

    // Update review fields
    review.rating = rating;
    review.comment = comment;

    await review.save();

    res.status(200).json({ success: true, message: "Review updated successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//delete review
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    // Validate reviewId
    if (!reviewId) {
      return res.status(400).json({ success: false, message: "Review ID is required" });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Delete review
    await Review.findByIdAndDelete(reviewId);
    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//get top rated sellers
const getTopRatedSellers = async (req, res) => {
  try {
    const topSellers = await Seller.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "seller",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
        },
      },
      {
        $match: { reviewCount: { $gt: 0 } }, // Only include sellers with reviews
      },
      {
        $sort: { averageRating: -1 }, // Sort by average rating descending
      },
      {
        $limit: 10, // Limit to top 10 sellers
      },
    ]);

    res.status(200).json({ success: true, message: "Top rated sellers fetched successfully", data: topSellers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

module.exports = {
  createReview,
  getReviewsBySeller,
  getReviewsByUser,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getTopRatedSellers,
};
