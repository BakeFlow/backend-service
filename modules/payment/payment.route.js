const express = require("express");
const router = express.Router();

const { createSubscription, getAllSubscriptions, getSubscriptionsBySellerId, getSubscriptionById, updateSubscription, deleteSubscription } = require("./controllers/subscription.controller");

//subscription routes
router.post("/subscription", createSubscription);
router.get("/subscriptions", getAllSubscriptions);
router.get("/subscriptions/seller/:sellerId", getSubscriptionsBySellerId);
router.get("/subscription/:id", getSubscriptionById);
router.put("/subscription/:id", updateSubscription);
router.delete("/subscription/:id", deleteSubscription);

module.exports = router;
