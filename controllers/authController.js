const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const { BadRequestError, UnauthorizedRequestError } = require("../errors");
const NotFoundError = require("../errors/not-found");
const asyncWrapper = require("../middlewares/asyncWrapper");
const User = require("../models/user");

const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, documentPassword) => {
  return await bcrypt.compare(password, documentPassword);
};

const register = asyncWrapper(async (req, res, next) => {
  const { email, password, fullname, mobile } = req.body;
  if (!email || !password || !fullname || !mobile) {
    return next(
      new BadRequestError("Fields cannot be empty", StatusCodes.BAD_REQUEST)
    );
  }

  const userWithEmail = await User.findOne({ email });
  if (userWithEmail) {
    return next(
      new NotFoundError(
        "User with this email address already exists",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const userWithMobile = await User.findOne({ mobile });
  if (userWithMobile) {
    return next(
      new NotFoundError(
        "User with this mobile number already exists",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const encryptedPassword = await encryptPassword(password);
  const user = await User.create({
    email,
    password: encryptedPassword,
    fullname,
    mobile,
  });
  const payload = {
    userId: user._id,
    email,
    fullname: user.fullname,
    mobile: user.mobile,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "10d" };
  const token = await jwt.sign(payload, secret, options);
  res.status(StatusCodes.CREATED).json({ data: token, success: true });
  // res.status(StatusCodes.CREATED).json({ success: true, data: user });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      new BadRequestError(
        "Both email and password are required",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  let user = await User.findOne({ email });
  if (!user) {
    return next(
      new NotFoundError(
        "User with this email address doesn't exist",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const isPasswordCorrect = await comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    return next(
      new NotFoundError("Incorrect password!", StatusCodes.NOT_FOUND)
    );
  }

  if (!user) {
    return next(
      new UnauthorizedRequestError(
        "Incorrect password!",
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  const payload = {
    userId: user._id,
    email,
    fullname: user.fullname,
    mobile: user.mobile,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "10d" };
  const token = await jwt.sign(payload, secret, options);
  res.status(200).json({ data: token, success: true });
});

module.exports = { register, login };
