const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  const accessToken = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
  return accessToken;
};

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET_REFRESH, { expiresIn: "7d" });
  return refreshToken;
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET_REFRESH);
  } catch {
    return null;
  }
};

const handleTokenReuse = async (userId) => {
  try {
    // Invalidate all tokens for the user
    // await Token.updateOne(
    //   { userId },
    //   {
    //     $set: {
    //       refreshToken: [],
    //       compromisedAt: new Date(),
    //     },
    //   }
    // );
  } catch (error) {
    console.error("Token reuse handling error:", error);
  }
};

const removeToken = async (tokenStore, token) => {
  tokenStore.refreshToken = tokenStore.refreshToken.filter((t) => t !== token);
  await tokenStore.save();
};

const cleanupExpiredTokens = async (tokenStore) => {
  tokenStore.refreshToken = tokenStore.refreshToken.filter((token) => {
    try {
      jwt.verify(token, process.env.JWT_SECRET_REFRESH);
      return true;
    } catch {
      return false;
    }
  });
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, handleTokenReuse, removeToken, cleanupExpiredTokens };
