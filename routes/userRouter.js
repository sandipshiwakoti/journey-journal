const express = require("express");
const { updateUser, updatePassword } = require("../controllers/userController");

const router = express.Router();
const upload = require("../uploadUtils/cloudUpload");

router.route("/updateAccount").put(updateUser);
router.route("/updatePassword").put(updatePassword);

module.exports = router;
