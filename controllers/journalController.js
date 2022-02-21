const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const { BadRequestError } = require("../errors");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Journal = require("../models/journal");
const user = require("../models/user");

const createJournal = asyncWrapper(async (req, res, next) => {
  const { title } = req.body;
  const createdBy = req.user.userId;

  let body = { title, createdBy };

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      use_filename: true,
      folder: `journey-journal/${createdBy}`,
    });
    body = {
      ...body,
      image: result.secure_url,
      imageId: result.public_id,
    };
  }

  const newJournal = await Journal.create(body);
  res.status(StatusCodes.CREATED).json({ success: true, data: newJournal });
});

const getJournals = asyncWrapper(async (req, res, next) => {
  const createdBy = req.user.userId;
  const journals = await Journal.find({ createdBy });
  res.status(StatusCodes.OK).json({ success: true, data: journals });
});

const getJournal = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user.userId;
  const journal = await Journal.findOne({ _id: id, createdBy });
  if (journal) {
    res.status(StatusCodes.OK).json({ success: true, data: journal });
  } else {
    next(new BadRequestError("Journal not found", StatusCodes.BAD_REQUEST));
  }
});

const updateJournal = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user.userId;
  const { title } = req.body;
  if (!title) {
    return next(
      new BadRequestError(
        "Required fields must be provided",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const journal = await Journal.findOne({ _id: id, createdBy });

  if (!journal) {
    next(new BadRequestError("Journal not found", StatusCodes.BAD_REQUEST));
  }

  let body = { title };
  if (req.file) {
    if (journal.imageId) {
      await cloudinary.uploader.destroy(journal.imageId);
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      use_filename: true,
      folder: `journey-journal/${createdBy}`,
    });
    body = {
      ...body,
      image: result.secure_url,
      imageId: result.public_id,
    };
  }

  const updatedJournal = await Journal.findOneAndUpdate(
    { _id: id, createdBy },
    body,
    { new: true, runValidators: true, omitUndefined: true }
  );
  res.status(StatusCodes.OK).json({ success: true, data: updatedJournal });
});

const removeJournal = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user.userId;
  const journal = await Journal.findOneAndDelete({ _id: id, createdBy });
  if (journal.imageId) {
    await cloudinary.uploader.destroy(journal.imageId);
  }
  if (!journal) {
    next(new BadRequestError("Journal not found", StatusCodes.BAD_REQUEST));
  } else {
    res.status(StatusCodes.OK).json({ success: true, data: journal });
  }
});

const updateLocation = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { location } = req.body;

  const createdBy = req.user.userId;
  const journal = await Journal.findOneAndUpdate(
    { _id: id, createdBy },
    { location },
    { new: true, runValidators: true }
  );
  if (!journal) {
    next(new BadRequestError("Journal not found", StatusCodes.BAD_REQUEST));
  } else {
    res.status(StatusCodes.OK).json({ success: true, data: journal });
  }
});

module.exports = {
  createJournal,
  getJournals,
  getJournal,
  updateJournal,
  removeJournal,
  updateLocation,
};
