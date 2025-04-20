import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa"; // Import icons
import "./Auth.css";
import * as sms from '../utils/sms';



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

  const handleRegister = (e) => {
    e.preventDefault();
    const { name, email, password, role, location, phone } = user;

    if (!name || !email || !password || !location || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const existingUser = storedUsers.find((u) => u.email === email);

    if (existingUser) {
      alert("Email already registered.");
      navigate("/login");
      return;
    }

    const newUser = { name, email, password, role, location, phone };
    storedUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(storedUsers));

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userType", role);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("phonenumber",phone)

    alert("Registration successful! Redirecting...");

    sms.sendSMS('+917010039023', 'Your order was successful. Thank you for buying!');

    setTimeout(() => {
      navigate("/user-selection");
    }, 500);
    return;
   
    


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
