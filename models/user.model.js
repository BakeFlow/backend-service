const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// Enums
const user_roles = require("../core/enums/user.roles.enum");
const auth_methods = require("../core/enums/auth.method.enum");
const user_status = require("../core/enums/user.status.enum");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
      // Required for local authentication
      required: function () {
        return this.authMethod === auth_methods.LOCAL;
      },
    },
    authMethod: {
      type: String,
      enum: Object.values(auth_methods),
      default: auth_methods.LOCAL,
    },
    role: {
      type: String,
      enum: Object.values(user_roles),
      default: user_roles.BUYER,
    },
    status: {
      type: String,
      enum: Object.values(user_status),
      default: user_status.PENDING,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: [
      {
        type: String,
        select: false,
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hash password before update
userSchema.pre("findOneAndUpdate", async function (next) {
  if (this.getUpdate().password) {
    const salt = await bcrypt.genSalt(10);
    this.getUpdate().password = await bcrypt.hash(this.getUpdate().password, salt);
  }
  next();
});

// Method to check password validity
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
