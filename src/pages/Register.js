import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import "./Auth.css";
import * as sms from "../utils/sms";
import * as email from "../utils/email";

const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
    location: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userType = localStorage.getItem("userType");

    if (isLoggedIn) {
      navigate(userType === "buyer" ? "/buyer-dashboard" : "/farmer-dashboard");
    }
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email: userEmail, password, role, location, phone } = user;

    if (!name || !userEmail || !password || !location || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const existingUser = storedUsers.find((u) => u.email === userEmail);

    if (existingUser) {
      alert("Email already registered.");
      navigate("/login");
      return;
    }

    const newUser = { name, email: userEmail, password, role, location, phone };
    storedUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(storedUsers));

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userType", role);
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("phonenumber", phone);

    setLoading(true);

    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

      // ✅ Send SMS
      await sms.sendSMS(
        formattedPhone,
        `Hi ${name}, registration was successful! Welcome to Farmers Market.`
      );

      // ✅ Send Email
      await email.sendEmail(
        name,
        userEmail,
        `Hi ${name},\n\nThank you for registering at Farmers Market! We're happy to have you onboard. 🌾`
      );

      alert("Registration successful! Redirecting...");
      setTimeout(() => {
        navigate("/user-selection");
      }, 500);

    } catch (error) {
      alert("Something went wrong while sending SMS/Email. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            <div className="input-group">
              <FaUser className="icon" />
              <input
                type="text"
                placeholder="Name"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                required
              />
            </div>

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

            <select
              value={user.role}
              onChange={(e) => setUser({ ...user, role: e.target.value })}
              required
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
            </select>

            <div className="input-group">
              <FaMapMarkerAlt className="icon" />
              <input
                type="text"
                placeholder="Location"
                value={user.location}
                onChange={(e) => setUser({ ...user, location: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <FaPhone className="icon" />
              <input
                type="text"
                placeholder="Phone Number"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                required
              />
            </div>

            <button type="submit">Register</button>
          </>
        )}
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default Register;
