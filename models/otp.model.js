const mongoose = require("mongoose");
const sendMail = require("../core/utils/mail.sender.utils");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  //MAX COUNT OF OTP VERIFICATION IS 3
  count: {
    type: Number,
    default: 0,
    max: 3,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600,
  },
});

const sendVerificationEmail = async (email, otp) => {
  try {
    const title = "Email Verification";
    const body = `<h3>Your OTP is :  ${otp}</h3>`;
    await sendMail(email, title, body);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

otpSchema.pre("save", async function (next) {
  const otp = this;
  try {
    await sendVerificationEmail(otp.email, otp.otp);
    next();
  } catch (error) {
    console.error("Error sending email: ", error);
    next(error);
  }
});

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
