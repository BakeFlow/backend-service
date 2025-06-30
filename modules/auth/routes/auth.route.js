const express = require("express");
const router = express.Router();
const { register, googleCallback, verifyOtp, resendOTP, forgotPassword, resetPassword, me, refresh, logout } = require("../controllers/auth.controller");

// Route to register a new user
router.post("/register", register);
// Route for Google OAuth callback
router.get("/google/callback", googleCallback);
// Route to verify OTP
router.post("/verify-otp", verifyOtp);
// Route to resend OTP
router.post("/resend-otp", resendOTP);
// Route to handle forgot password
router.post("/forgot-password", forgotPassword);
// Route to reset password
router.post("/reset-password", resetPassword);
// Route to get user profile
router.get("/me", me);
// Route to refresh access token
router.post("/refresh", refresh);
// Route to logout user
router.post("/logout", logout);

module.exports = router;
