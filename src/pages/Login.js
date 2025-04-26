// src/pages/Login.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import "./Auth.css";
import { auth } from "../firebase"; // correct firebase import
import { signInWithEmailAndPassword } from "firebase/auth";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";

const Login = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = user;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", loggedInUser.email);
      localStorage.setItem("userId", loggedInUser.uid);

      alert("Login successful! Sending confirmation...");

      try {
        // 🔥 Send login SMS
        // Replace with your own method to fetch user's phone number if needed
        // For now, just a dummy +91XXXXXXXXXX
        const phoneNumber = "+91XXXXXXXXXX";
        await sendSMS(phoneNumber, `Hi ${loggedInUser.email}, you have successfully logged into Farmers Market.`);

        // 🔥 Send login Email
        await sendEmail(
          loggedInUser.email,
          "Login Successful - Farmers Market",
          `Hi ${loggedInUser.email},\n\nYou have successfully logged into your account.\n\nIf this wasn't you, please reset your password immediately.\n\nThank you,\nFarmers Market Team`
        );

        console.log("SMS and Email Sent Successfully!");

      } catch (error) {
        console.error("Error sending SMS/Email:", error);
      }

      setTimeout(() => {
        navigate("/user-selection");
      }, 1000);

    } catch (error) {
      console.error("Login Error:", error);

      if (error.code === "auth/user-not-found") {
        alert("User not found. Please register first.");
      } else if (error.code === "auth/wrong-password") {
        alert("Invalid password!");

        // 🔥 Send SMS warning on wrong password attempt
        try {
          const phoneNumber = "+91XXXXXXXXXX"; // Replace later
          await sendSMS(phoneNumber, `Someone tried to login with wrong password to your Farmers Market account.`);
        } catch (error) {
          console.error("Failed to send wrong password SMS:", error);
        }
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
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
          </>
        )}
      </form>
      <p>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;
