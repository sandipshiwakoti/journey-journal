const CustomError = require("./custom-error");
const { StatusCodes } = require("http-status-codes");

class UnauthorizedRequestError extends CustomError {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

module.exports = UnauthorizedRequestError;
