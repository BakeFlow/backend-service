const express = require("express");
const router = express.Router();

const { getSellersAndBuyersCounts, getAccountCreationHistory } = require("./controllers/user.controller");

// user routes
router.get("/sellers-buyers-counts", getSellersAndBuyersCounts);
router.get("/account-creation-history", getAccountCreationHistory);

module.exports = router;
