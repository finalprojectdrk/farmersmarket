// /src/utils/email.js
import emailjs from 'emailjs-com';

const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const PUBLIC_KEY = 'your_public_key';

export const sendEmail = async (name, email, message) => {
  try {
    const templateParams = {
      to_name: name,
      to_email: email,
      message: message,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    
    console.log('Email Sent:', response.text);
    return response;
  } catch (error) {
    console.error('Email Send Error:', error);
    throw error;
  }
};
