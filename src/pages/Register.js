import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import "./Auth.css";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email"; // Make sure this path is correct
import { toast } from "react-toastify"; // Install react-toastify if you haven't

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

    // Basic validations
    if (!name || !email || !password || !location || !phone) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const existingUser = storedUsers.find((u) => u.email === email);

    if (existingUser) {
      toast.error("Email already registered. Please login.");
      navigate("/login");
      return;
    }

    const newUser = { name, email, password, role, location, phone };
    storedUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(storedUsers));

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userType", role);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("phonenumber", phone);

    toast.success("Registration successful!");

    // --- Send SMS ---
    try {
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+91")) {
        formattedPhone = "+91" + formattedPhone;
      }

      await sendSMS(
        formattedPhone,
        `Hi ${name}, your registration was successful! Welcome to Farmers Market.`
      );
      toast.success("SMS sent successfully!");
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      toast.error("SMS failed to send.");
    }

    // --- Send Email ---
    try {
      await sendEmail({
        to_email: email,
        to_name: name,
        message: `Hi ${name},\n\nThank you for registering at Farmers Market!\n\nHappy shopping!`,
      });
      toast.success("Email sent successfully!");
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      toast.error("Email failed to send.");
    }

    setTimeout(() => {
      navigate("/user-selection");
    }, 1000);
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
