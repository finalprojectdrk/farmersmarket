import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import "./Auth.css";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import { auth, db } from "../firebase"; // Make sure you have a firebase.js file
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

    setLoading(true);

    try {
      // 1️⃣ Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
      const firebaseUser = userCredential.user;

      // 2️⃣ Check if already user data exists (shouldn't but safe to check)
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        alert("User already exists in database. Please login.");
        navigate("/login");
        return;
      }

      // 3️⃣ Save User Profile into Firestore
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        name,
        email: userEmail,
        role,
        location,
        phone,
        createdAt: new Date(),
      });

      // 4️⃣ Local Session Setup
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", role);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("phonenumber", phone);

      // 5️⃣ Send SMS and Email
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

      await sendSMS(
        formattedPhone,
        `Hi ${name}, registration successful! Welcome to Farmers Market. 🌾`
      );

      await sendEmail(
        name,
        userEmail,
        `Hi ${name},\n\nThanks for registering at Farmers Market! Let's grow together! 🌱`
      );

      alert("Registration successful! Redirecting...");
      setTimeout(() => {
        navigate("/user-selection");
      }, 500);

    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message || "Registration failed. Please try again.");
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
