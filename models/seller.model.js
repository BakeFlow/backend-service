const mongoose = require("mongoose");
const User = require("./user.model");

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.name,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Seller = mongoose.model("Seller", sellerSchema);
module.exports = Seller;
