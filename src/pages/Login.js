import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import "./Auth.css";
import { sendSMS } from '../utils/sms';
import { sendEmail } from '../utils/email'; // import email sending

const Login = ({ setIsLoggedIn, setUserType }) => {
  const [user, setUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = user;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const validUser = storedUsers.find((u) => u.email === email);

    if (!validUser) {
      alert("Email not found. Please register first.");
      return;
    }

    if (validUser.password !== password) {
      alert("Invalid password!");

      // 🔥 Send SMS alert for wrong password attempt
      const cleanedPhone = validUser.phone.startsWith("+91") ? validUser.phone : `+91${validUser.phone}`;
      try {
        await sendSMS(cleanedPhone, `Someone tried to login with wrong password to your Farmers Market account.`);
      } catch (error) {
        console.error("Failed to send wrong password SMS:", error);
      }

      return;
    }

    // ✅ Save login session
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userType", validUser.role);
    localStorage.setItem("userEmail", validUser.email);
    localStorage.setItem('phonenumber', validUser.phone);

    setIsLoggedIn(true);
    setUserType(validUser.role);

    alert("Login successful! Sending confirmation...");

    try {
      // 🔥 Send login SMS
      const cleanedPhone = validUser.phone.startsWith("+91") ? validUser.phone : `+91${validUser.phone}`;
      await sendSMS(cleanedPhone, `Hi ${validUser.name}, you have successfully logged into Farmers Market.`);

      // 🔥 Send login Email
      await sendEmail(
        validUser.email,
        "Login Successful - Farmers Market",
        `Hi ${validUser.name},\n\nYou have successfully logged into your account.\n\nIf this wasn't you, please reset your password immediately.\n\nThank you,\nFarmers Market Team`
      );

      console.log("SMS and Email Sent Successfully!");
    } catch (error) {
      console.error("Error sending SMS/Email:", error);
    }

    setTimeout(() => {
      navigate("/user-selection");
    }, 1000);
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <FaEnvelope className="icon" />
          <input
            type="email"
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type="password"
            placeholder="Password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;
