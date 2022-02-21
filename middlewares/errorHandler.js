const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors/custom-error");

const errorHandler = (err, req, res, next) => {
  const customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong",
  };

  if (err.code && err.code === 11000) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "User already exists.",
    });
  }

  res
    .status(customError.statusCode)
    .json({ success: false, message: customError.message });
};

module.exports = errorHandler;
