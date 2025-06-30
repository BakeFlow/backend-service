const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const cros = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const morgan = require("morgan");
const passport = require("passport");

dotenv.config();

const connectDB = require("./core/configs/db.config");
const errorHandler = require("./core/middlewares/error.handler.middelware");

const app = express();

/*
 * ==============================================================================
 * Middlewares
 * ==============================================================================
 */
app.use(rateLimit({ windowMs: 60 * 1000, max: 50 }));
app.use(cros());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(passport.initialize());
require("./core/strategies/local.strategy");
require("./core/strategies/jwt.strategy");
require("./core/strategies/google.strategy");

/*
 * ==============================================================================
 * Routes
 * ==============================================================================
 */

app.use("/api/auth", require("./modules/auth/routes/auth.route"));
app.use("/api/bakery", require("./modules/Bakery/bakery.route"));

//ping route
app.get("/api/ping", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

app.all("/api/*name", (req, res) => {
  res.status(404).json({ success: false, message: "Requested resource not found" });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB();
mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
