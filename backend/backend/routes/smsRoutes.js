// routes/smsRoutes.js
const express = require("express");
const twilio = require("twilio");
const router = express.Router();
require("dotenv").config(); // Ensure .env is loaded

// Twilio credentials from .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Safety check
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn("⚠️ Missing Twilio configuration in .env");
}

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// POST /api/sms - Send SMS using Twilio
router.post("/sms", async (req, res) => {
  const { message, phoneNumber } = req.body;
  console.log("📩 Received SMS data:", { message, phoneNumber });

  // Input validation
  if (!phoneNumber || !message) {
    return res.status(400).json({
      success: false,
      message: "Phone number and message are required.",
    });
  }

  // Ensure phone number is in correct format
  const formattedPhone = phoneNumber.startsWith("+")
    ? phoneNumber
    : `+91${phoneNumber}`;

  try {
    // Send SMS
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log("✅ SMS sent successfully:", response.sid);
    res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      sid: response.sid,
    });
  } catch (err) {
    console.error("❌ Error sending SMS:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to send SMS",
      error: err.message,
    });
  }
});

module.exports = router;
