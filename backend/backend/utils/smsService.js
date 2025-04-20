const sendSMS = (phone, message) => {
  console.log(`Sending SMS to ${phone}: ${message}`);
  // integrate Twilio, Fast2SMS, etc. here
};

module.exports = { sendSMS };
