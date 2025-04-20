const express = require("express");
const { sendSMS } = require("../controllers/smsController");
const router = express.Router();

router.post("/sms", sendSMS);

module.exports = router;
