// /api/sms.js
import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Handle preflight
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required.' });
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message: message,
        language: 'english',
        numbers: phone,
      },
      {
        headers: {
          authorization: 'MTNJG1GEv8w3pozl6XlC2qf5JffMoDXOo6ymU4olYVAddW0B1TBqBcLLvKw1',
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({ success: true, response: response.data });
  } catch (error) {
    console.error('SMS Error:', error?.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
