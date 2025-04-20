import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa"; // Import icons
import "./Auth.css";
import { sendSMS } from '../utils/sms';

const Login = ({ setIsLoggedIn, setUserType }) => {
  const [user, setUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = (e) => {
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
      alert("Invalid password.");
      sendSMS('phonenumber', 'Enter Correct Password!');
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userType", validUser.role);
    localStorage.setItem("userEmail", validUser.email);
    localStorage.setItem("phonenumber", phone);

    setIsLoggedIn(true);
    setUserType(validUser.role);

    alert("Login successful! Redirecting...");
    
    setTimeout(() => {
      navigate("/user-selection");
    }, 500);
  };
 // ✅ Send SMS to the registered user
    const cleanedPhone = phone.startsWith("+91") ? phone.slice(3) : phone;

    await sms.sendSMS(
      cleanedPhone,
      `Hi ${name}, Logged in Successfully! Welcome to Farmers Market. Enjoy Shopping`
    );

    setTimeout(() => {
      navigate("/user-selection");
    }, 500);
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
