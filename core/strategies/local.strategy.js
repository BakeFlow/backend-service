const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/user.model");

// Strategy for login using Email & Password
passport.use(
  "local-email",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        const validate = await user.isValidPassword(password);
        if (!validate) {
          return done(null, false, { message: "Invalid password" });
        }

        user.password = undefined;
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Strategy for login using userName & Password
passport.use(
  "local-username",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (userName, password, done) => {
      try {
        const user = await User.findOne({ userName }).select("+password");
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        const validate = await user.isValidPassword(password);
        if (!validate) {
          return done(null, false, { message: "Invalid password" });
        }

        user.password = undefined;
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
