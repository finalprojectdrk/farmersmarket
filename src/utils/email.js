// /src/utils/email.js
import emailjs from "emailjs-com";

export const sendEmail = async (userName, userEmail) => {
  // Ensure email is not empty
  if (!userEmail || userEmail.trim() === "") {
    console.error("Email address is empty!");
    return;
  }

  const templateParams = {
    user_name: userName,
    user_email: userEmail,
    message: `Hi ${userName}, your registration was successful! Welcome to Farmers Market.`,
  };

  try {
    await emailjs.send(
  'service_farmers', // <--- your Service ID
'template_e983pnq', // <--- your Template ID
templateParams,
'AUwJcDs3i0NgUbhaf' // <--- your Public Key (NOT template ID)
  );
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
