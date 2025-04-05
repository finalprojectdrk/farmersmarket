export const sendSMS = async (phone, message) => {
  try {
    const res = await fetch('http://localhost:8000/src/send-sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    const data = await res.json();
    if (data.status === 'success') {
      alert('SMS sent!');
    } else {
      alert('Failed to send SMS');
    }
  } catch (err) {
    console.error('Error sending SMS:', err);
  }
};
