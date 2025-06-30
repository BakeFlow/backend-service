const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

const options = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JWTStrategy(options, async (payload, done) => {
    try {
      if (payload?._id === undefined || payload?.role === undefined) {
        return done(null, false);
      }

      const user = {
        _id: payload._id,
        role: payload.role,
      };

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

module.exports = passport;
