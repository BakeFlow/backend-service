const mongoose = require("mongoose");
const User = require("./user.model");
const Seller = require("./seller.model");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Seller,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    images: [
      {
        type: String,
        required: false,
      },
    ],
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
