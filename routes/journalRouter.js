const express = require("express");
const {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  removeJournal,
  updateLocation,
} = require("../controllers/journalController");

const router = express.Router();
const upload = require("../uploadUtils/cloudUpload");

router.route("/").get(getJournals);
router.route("/:id").get(getJournal).delete(removeJournal);
router.route("/:id/location").put(updateLocation);
router.post("/", upload.single("image"), createJournal);
router.put("/:id", upload.single("image"), updateJournal);
module.exports = router;
