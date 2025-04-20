const axios = require("axios");

const sendSMS = async (req, res) => {
  const { phone, message } = req.body;

  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "v3",
        sender_id: "TXTIND",
        message,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("SMS Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendSMS };
