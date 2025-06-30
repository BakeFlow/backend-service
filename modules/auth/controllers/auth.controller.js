const otpGenerator = require("otp-generator");

const User = require("../../../models/user.model");
const OTP = require("../../../models/otp.model");

const auth_methods = require("../../../core/enums/auth.method.enum");
const user_roles = require("../../../core/enums/user.roles.enum");
const user_status = require("../../../core/enums/user.status.enum");

const { verifyRefreshToken, cleanupExpiredTokens, generateAccessToken, generateRefreshToken } = require("../../../core/utils/token.utils");

const register = async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;

    // Validate input
    if (!username || !email || !password || !usertype) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (usertype !== user_roles.BUYER && usertype !== user_roles.SELLER) {
      return res.status(400).json({ success: false, message: "Invalid user type" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: usertype, // Set role to buyer
      authMethod: auth_methods.LOCAL, // Set authentication method to local
    });

    // Save user to the database
    await newUser.save();

    const otp = otpGenerator.generate(4, { upperCase: false, specialChars: false });
    const OTPdoc = new OTP({
      email: newUser.email,
      otp: otp,
      count: 0, // Initialize count to 0
    });
    await OTPdoc.save();

    res.status(201).json({ success: true, message: "Buyer registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//google auth callback
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const tokenStore = await User.findById(user._id).select("+refreshToken");
    if (!tokenStore) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    tokenStore.refreshToken.push(refreshToken);
    // Implement max tokens per user
    const MAX_TOKENS = 5;
    if (tokenStore.refreshToken.length > MAX_TOKENS) {
      tokenStore.refreshToken = tokenStore.refreshToken.slice(-MAX_TOKENS);
    }

    await tokenStore.save();

    user.password = undefined;
    user.refreshToken = undefined;

    res
      .status(200)
      .cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "None", secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({
        success: true,
        message: "User logged in successfully",
        data: { user: user, accessToken: accessToken, refreshToken: refreshToken },
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
};

//verify otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Update user status to verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === user_roles.BUYER) {
      user.status = user_status.VERIFIED; // Update user status to verified
    }

    user.emailVerified = true; // Set emailVerified to true
    await user.save();

    //delete OTP record after successful verification
    await OTP.deleteOne({ email, otp });

    res.status(200).json({ success: true, message: "OTP verified successfully", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//resend otp
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    const otp = otpGenerator.generate(4, { upperCase: false, specialChars: false });

    const isOtp = await OTP.findOne({ email });
    if (isOtp) {
      isOtp.otp = otp;

      if (isOtp.count >= 3) {
        return res.status(400).json({
          success: false,
          error: "OTP verification limit exceeded try again in 10 minutes",
        });
      }

      isOtp.count += 1;
      await isOtp.save();
    } else {
      await OTP.create({ email, otp });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

    const isOtp = await OTP.findOne({ email });
    if (isOtp) {
      isOtp.otp = otp;

      if (isOtp.count >= 3) {
        return res.status(400).json({
          success: false,
          error: "OTP verification limit exceeded try again in 10 minutes",
        });
      }

      isOtp.count += 1;
      await isOtp.save();
    } else {
      await OTP.create({ email, otp });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email, otp and password",
      });
    }

    const otpData = await OTP.findOne({ email, otp });
    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    user.password = password;

    await user.save();

    //remove otp
    await OTP.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

//me
const me = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const userData = await User.findById(user._id);
    if (!userData) {
      return res.status(400).json({
        success: false,
        error: "User not found",
      });
    }

    userData.password = undefined;
    userData.refreshToken = undefined;

    res.status(200).json({
      success: true,
      message: "User found",
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error finding user",
      error: error.message,
    });
  }
};

//refresh token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const accessToken = req.headers?.authorization?.split(" ")[1];

    if (!refreshToken || !accessToken) {
      return res.status(401).json({
        success: false,
        error: "Both tokens required",
      });
    }

    // Decode access token to get user info
    const decodedAccess = jwt.decode(accessToken);

    // Clear the current refresh token cookie immediately
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    // Verify refresh token
    const decodedRefresh = await verifyRefreshToken(refreshToken);
    if (!decodedRefresh || !decodedRefresh?._id) {
      return res.status(403).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    // Ensure both tokens belong to same user
    if (decodedAccess?._id !== decodedRefresh._id) {
      return res.status(403).json({
        success: false,
        error: "Token mismatch",
      });
    }

    // Find and validate token store
    const tokenStore = await User.findById(decodedRefresh._id).select("+refreshToken");
    if (!tokenStore || !tokenStore.refreshToken.includes(refreshToken)) {
      return res.status(403).json({
        success: false,
        error: "Invalid token",
      });
    }

    // Clean up expired tokens
    await cleanupExpiredTokens(tokenStore);

    // Generate new tokens with shorter expiry for higher security
    const newAccessToken = generateAccessToken(decodedRefresh);
    const newRefreshToken = generateRefreshToken(decodedRefresh);

    // Update token store with new refresh token
    tokenStore.refreshToken = tokenStore.refreshToken.filter((token) => token !== refreshToken).concat(newRefreshToken);

    // Implement max tokens per user
    const MAX_TOKENS = 5;
    if (tokenStore.refreshToken.length > MAX_TOKENS) {
      tokenStore.refreshToken = tokenStore.refreshToken.slice(-MAX_TOKENS);
    }

    // Save token usage metadata
    // tokenStore.lastUsed = new Date();
    // tokenStore.lastIp = req.ip;
    await tokenStore.save();

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        success: true,
        message: "Tokens refreshed",
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//logout
const logout = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token not found",
      });
    }

    const tokenStore = await User.findById(user._id).select("+refreshToken");
    if (!tokenStore) {
      return res.status(401).json({
        success: false,
        error: "Invalid user",
      });
    }

    tokenStore.refreshToken = tokenStore.refreshToken.filter((token) => token !== refreshToken);
    await tokenStore.save();

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error logging out user",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  googleCallback,
  verifyOtp,
  resendOTP,
  forgotPassword,
  resetPassword,
  me,
  refresh,
  logout,
};
