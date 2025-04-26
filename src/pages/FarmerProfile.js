import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../firebase"; // Assuming you already have firebase.js configured
import "./FarmerProfile.css";

const FarmerProfile = () => {
  const navigate = useNavigate();
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const db = getFirestore();
        const user = auth.currentUser;

        if (!user) {
          alert("User not logged in!");
          navigate("/login");
          return;
        }

        const farmersRef = collection(db, "users"); // Your Firestore collection
        const q = query(farmersRef, where("email", "==", user.email), where("role", "==", "farmer"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const farmerDoc = querySnapshot.docs[0];
          setFarmerData(farmerDoc.data());
        } else {
          alert("Farmer profile not found!");
        }
      } catch (error) {
        console.error("Error fetching farmer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [navigate]);

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        alert("You have logged out!");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const goToDashboard = () => {
    navigate("/farmer-dashboard");
  };

  return (
    <div className="farmer-profile-container">
      <h2>Farmer Profile</h2>
      {loading ? (
        <p>Loading farmer data...</p>
      ) : farmerData ? (
        <div className="farmer-info">
          <p><strong>Name:</strong> {farmerData.name}</p>
          <p><strong>Email:</strong> {farmerData.email}</p>
          <p><strong>Location:</strong> {farmerData.location}</p>
          <p><strong>Phone:</strong> {farmerData.phone}</p>
        </div>
      ) : (
        <p>No farmer data available.</p>
      )}
      <br />
      <button onClick={goToDashboard} className="dashboard-btn">Go to Dashboard</button>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default FarmerProfile;
