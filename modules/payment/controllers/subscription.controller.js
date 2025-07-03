const Subscription = require("../../../models/subscription.model");
const Seller = require("../../../models/seller.model");
const subscription_status = require("../../../core/enums/subscription.status.enum");

//create subscription
const createSubscription = async (req, res) => {
  try {
    const { sellerId, plan, price, endDate } = req.body;

    // Validate input
    if (!sellerId || !plan || !price || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    //check seller has an active or pending subscription
    const existingSubscription = await Subscription.findOne({
      seller: sellerId,
      status: { $in: [subscription_status.ACTIVE, subscription_status.PENDING] },
    });
    if (existingSubscription) {
      return res.status(400).json({ success: false, message: "Seller already has an active or pending subscription" });
    }

    const subscription = new Subscription({
      seller: sellerId,
      plan,
      price,
      endDate,
      status: subscription_status[0], // Default status
    });

    await subscription.save();

    return res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate("seller", "businessName ownerName").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// get subscriptions by seller id
const getSubscriptionsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }

    const subscriptions = await Subscription.find({ seller: sellerId }).populate("seller", "businessName ownerName").sort({ createdAt: -1 });

    if (subscriptions.length === 0) {
      return res.status(404).json({ success: false, message: "No subscriptions found for this seller" });
    }

    return res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions by seller ID:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//get subscription by id
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id).populate("seller", "businessName ownerName");

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//update subscription
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, price, endDate, status } = req.body;

    // Validate input
    if (!plan || !price || !endDate || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    //check status is valid
    if (!Object.values(subscription_status).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid subscription status" });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    // Update subscription fields
    subscription.plan = plan;
    subscription.price = price;
    subscription.endDate = endDate;
    subscription.status = status;
    await subscription.save();
    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//delete subscription
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    return res.status(200).json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionsBySellerId,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
};
