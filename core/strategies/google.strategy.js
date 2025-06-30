const passport = require("passport");
const User = require("../../models/user.model");
const user_status = require("../enums/user.status.enum");
const auth_methods = require("../enums/auth.method.enum");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const options = {
  clientID: process.env.GOOGLE_WEB_CLIENT_ID,
  clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
};

passport.use(
  new GoogleStrategy(options, async (accessToken, refreshToken, profile, done) => {
    try {
      //check if email already exists
      let user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        return done(null, user);
      }

      // If user does not exist, create a new user
      user = new User({
        username: profile.displayName,
        email: profile.emails[0].value,
        profile: profile.photos[0].value,
        status: user_status.VERIFIED,
        emailVerified: true,
        authMethod: auth_methods.GOOGLE,
      });

      await user.save();

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

module.exports = passport;
