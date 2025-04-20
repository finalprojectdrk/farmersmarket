import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import "./Auth.css";
import * as sms from '../utils/sms'; // Optional: this logs SMS in console

const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
    location: "",
    phone: "",
  });

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
    const { name, email, password, role, location, phone } = user;

    if (!name || !email || !password || !location || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post("https://api.farmerssmarket.com/api/register", {
        name,
        email,
        password,
        role,
        location,
        phone,
      });

      alert(res.data.message);

      // Simulate login
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", role);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("phonenumber", phone);

      // Optional SMS
      sms.sendSMS(phone, 'Your order was successful. Thank you for buying!');

      setTimeout(() => {
        navigate("/user-selection");
      }, 500);

    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Try again.";
      alert(message);
      if (err.response?.status === 400) {
        navigate("/login");
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
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
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default Register;
