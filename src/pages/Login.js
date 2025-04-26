import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import "./Auth.css";
import { sendSMS } from '../utils/sms';
import { sendEmail } from '../utils/email';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // Make sure you have firebase.js set up properly

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

    try {
      // ✅ Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // ✅ Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));

      if (!userDoc.exists()) {
        alert("User profile not found!");
        return;
      }

      const userData = userDoc.data();

      // ✅ Save login session
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", userData.role); // role must be stored while registration
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("phonenumber", userData.phone);

      setIsLoggedIn(true);
      setUserType(userData.role);

      alert("Login successful! Sending confirmation...");

      try {
        const cleanedPhone = userData.phone.startsWith("+91") ? userData.phone : `+91${userData.phone}`;

        // 🔥 Send login SMS
        await sendSMS(cleanedPhone, `Hi ${userData.name}, you have successfully logged into Farmers Market.`);

        // 🔥 Send login Email
        await sendEmail(
          userData.email,
          "Login Successful - Farmers Market",
          `Hi ${userData.name},\n\nYou have successfully logged into your account.\n\nIf this wasn't you, please reset your password immediately.\n\nThank you,\nFarmers Market Team`
        );

        console.log("SMS and Email Sent Successfully!");
      } catch (error) {
        console.error("Error sending SMS/Email:", error);
      }

      // ✅ Navigate to user selection
      setTimeout(() => {
        navigate("/user-selection");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
    }
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
