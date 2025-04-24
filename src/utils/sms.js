// /src/utils/sms.js
export const sendSMS = async (phone, message) => {
  try {
    const response = await fetch('https://farmerssmarket.com/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SMS Send Error:', errorData);
      throw new Error('Failed to send SMS');
    }

    const data = await response.json();
    console.log('SMS Sent:', data);
    return data;
  } catch (error) {
    console.error('SMS Send Error:', error.message);
    throw error;
  }
};
