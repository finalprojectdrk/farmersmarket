import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { sendSMS } from '../utils/sms';
import { sendEmail } from '../utils/email';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const Login = ({ setIsLoggedIn, setUserType }) => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = user;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, "users", userId));

      if (!userDoc.exists()) {
        alert("User profile not found!");
        return;
      }

      const userData = userDoc.data();

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", userData.role);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("phonenumber", userData.phone);

      setIsLoggedIn(true);
      setUserType(userData.role);

      alert("Login successful! Sending confirmation...");

      try {
        const cleanedPhone = userData.phone.startsWith("+91") ? userData.phone : `+91${userData.phone}`;

        await sendSMS(cleanedPhone, `Hi ${userData.name}, you have successfully logged into Farmers Market.`);

        await sendEmail(
          userData.email,
          "Login Successful - Farmers Market",
          `Hi ${userData.name},\n\nYou have successfully logged into your account.\n\nIf this wasn't you, please reset your password immediately.\n\nThank you,\nFarmers Market Team`
        );

        console.log("SMS and Email Sent Successfully!");
      } catch (error) {
        console.error("Error sending SMS/Email:", error);
      }

      setTimeout(() => {
        navigate("/user-selection");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Login</h2>
      <form onSubmit={handleLogin}>
        {/* Email Field */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <FaEnvelope style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888'
          }} />
          <input
            type="email"
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Password Field */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <FaLock style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888'
          }} />
          <input
            type={passwordVisible ? "text" : "password"}
            placeholder="Password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '10px 38px 10px 38px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <span onClick={() => setPasswordVisible(!passwordVisible)} style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: '#888'
          }}>
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit" style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Login
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Don't have an account? <a href="/register" style={{ color: '#4CAF50', textDecoration: 'none' }}>Register here</a>
      </p>
    </div>
  );
};

export default Login;
