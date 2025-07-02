const express = require("express");
const router = express.Router();
const passport = require("passport");

const { register, login, googleCallback, verifyOtp, resendOTP, forgotPassword, resetPassword, me, refresh, logout } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", passport.authenticate("local-email", { session: false }), login);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), googleCallback);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", passport.authenticate("jwt", { session: false }), me);

router.post("/refresh", refresh);
router.post("/logout", passport.authenticate("jwt", { session: false }), logout);

module.exports = router;
