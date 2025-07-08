const mongoose = require("mongoose");
const Seller = require("./seller.model");
const subscription_plan = require("../core/enums/subscription.plan.enum");
const subscription_status = require("../core/enums/subscription.status.enum");

const subscriptionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Seller,
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(subscription_plan),
      default: subscription_plan[0],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(subscription_status),
      default: subscription_status[0],
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
