// /pages/api/sms.js
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  // Handle CORS (Optional but useful)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Handle preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Phone number and message are required.' });
  }

  try {
    const twilioResponse = await client.messages.create({
      body: message,
      from: fromPhone,
      to: phoneNumber,
    });

    return res.status(200).json({ success: true, sid: twilioResponse.sid });
  } catch (error) {
    console.error('Twilio Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
