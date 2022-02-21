const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const { UnauthorizedRequestError } = require("../errors");
const asyncWrapper = require("./asyncWrapper");

const auth = asyncWrapper(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized!" });
  }
  const secret = process.env.JWT_SECRET;
  await jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return next(
        new UnauthorizedRequestError(
          "You are not authorized",
          StatusCodes.UNAUTHORIZED
        )
      );
    }
    const { userId, email, fullname } = decoded;
    req.user = { userId, email, fullname };
    next();
  });
});

module.exports = auth;
