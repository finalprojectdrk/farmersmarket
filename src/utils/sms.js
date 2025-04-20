// /src/utils/sms.js
import axios from 'axios';

export const sendSMS = async (phone, message) => {
  try {
    const response = await axios.post(
      'https://farmerssmarket.com/api/sms',
      {
        phoneNumber: phone, // ✅ Fix here
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('SMS Sent:', response.data);
  } catch (error) {
    console.error('SMS Send Error:', error.response?.data || error.message);
  }
};
