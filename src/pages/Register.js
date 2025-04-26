import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Auth.css";

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

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, password, role, location, phone } = user;

    if (!name || !email || !password || !location || !phone) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userCreated = userCredential.user;

      // Save user profile in Firestore
      await setDoc(doc(db, "users", userCreated.uid), {
        name,
        email,
        role,
        location,
        phone,
        createdAt: new Date(),
      });

      alert("Registration Successful!");
      navigate("/login");

    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} required />
        <input type="email" placeholder="Email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} required />
        <select value={user.role} onChange={(e) => setUser({ ...user, role: e.target.value })}>
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
        </select>
        <input type="text" placeholder="Location" value={user.location} onChange={(e) => setUser({ ...user, location: e.target.value })} required />
        <input type="text" placeholder="Phone" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} required />
        <button type="submit">{loading ? "Registering..." : "Register"}</button>
      </form>
    </div>
  );
};

export default Register;
