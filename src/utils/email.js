// /src/utils/email.js
import emailjs from 'emailjs-com';

const SERVICE_ID = 'service_farmers';    // <--- your Service ID
const TEMPLATE_ID = 'template_e983pnq'; // <--- your Template ID
const PUBLIC_KEY = 'AUwJcDs3i0NgUbhaf';    // <--- your Public Key (NOT template ID)

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
