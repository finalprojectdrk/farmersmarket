import axios from "axios";

export const sendSMS = async (phone, message) => {
  try {
    const res = await axios.post("https://api.farmerssmarket.com/api/sms", {
      phone,
      message,
    });
    console.log("SMS response:", res.data);
  } catch (err) {
    console.error("SMS Error:", err);
  }
};
