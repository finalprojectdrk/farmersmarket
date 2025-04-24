// /api/sms.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Preflight request
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required.' });
  }

  try {
    const apiResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: 'MTNJG1GEv8w3pozl6XlC2qf5JffMoDXOo6ymU4olYVAddW0B1TBqBcLLvKw1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        language: 'english',
        numbers: phone,
      }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Fast2SMS error:', data);
      return res.status(500).json({ success: false, error: data });
    }

    return res.status(200).json({ success: true, response: data });
  } catch (error) {
    console.error('Network error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
