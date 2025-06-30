const errorHandler = (error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "An error occurred",
    error: error.message,
  });
};

module.exports = errorHandler;
