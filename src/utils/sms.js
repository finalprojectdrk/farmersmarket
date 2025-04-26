// /src/utils/sms.js

export const sendSMS = async (phone, message) => {
  try {
    const response = await fetch('https://farmerssmarket.com/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phone, // Must match the backend key
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SMS Send Error:', data);
      throw new Error(data.error || 'Failed to send SMS');
    }

    console.log('SMS Sent:', data);
    return data;
  } catch (error) {
    console.error('SMS Send Exception:', error.message);
    throw error;
  }
};
