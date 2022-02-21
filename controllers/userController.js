const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthorizedRequestError } = require("../errors");
const NotFoundError = require("../errors/not-found");
const asyncWrapper = require("../middlewares/asyncWrapper");
const User = require("../models/user");

const comparePassword = async (password, documentPassword) => {
  return await bcrypt.compare(password, documentPassword);
};

const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const updateUser = asyncWrapper(async (req, res, next) => {
  const { fullname, mobile, email } = req.body;
  const userId = req.user.userId;

  if (!email || !fullname || !mobile) {
    return next(
      new BadRequestError("Fields cannot be empty", StatusCodes.BAD_REQUEST)
    );
  }

  const user = await User.findOne({ _id: userId });
  console.log(user);

  if (!user) {
    return next(
      new UnauthorizedRequestError(
        "Access unauthorized!",
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    {
      fullname,
      mobile,
      email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  const payload = {
    userId: user._id,
    email,
    fullname,
    mobile,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "10d" };
  const token = await jwt.sign(payload, secret, options);
  res.status(StatusCodes.OK).json({ data: token, success: true });
});

const updatePassword = asyncWrapper(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const userId = req.user.userId;

  const user = await User.findOne({ _id: userId });

  if (!user) {
    return next(
      new UnauthorizedRequestError(
        "Access unauthorized!",
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  const isPasswordCorrect = await comparePassword(
    currentPassword,
    user.password
  );

  if (!isPasswordCorrect) {
    return next(
      new NotFoundError("Incorrect password provided!", StatusCodes.NOT_FOUND)
    );
  }

  const encryptedPassword = await encryptPassword(newPassword);
  const updatedUser = await User.updateOne(
    { _id: userId },
    { password: encryptedPassword },
    {
      runValidators: true,
      omitUndefined: true,
    }
  );

  const payload = {
    userId: user._id,
    email: user.email,
    fullname: user.fullname,
    mobile: user.mobile,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "10d" };
  const token = await jwt.sign(payload, secret, options);
  res.status(StatusCodes.OK).json({ data: token, success: true });
});

module.exports = { updateUser, updatePassword };
