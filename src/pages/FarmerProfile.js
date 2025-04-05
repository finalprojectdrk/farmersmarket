import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FarmerProfile.css";

const FarmerProfile = () => {
  const navigate = useNavigate();
  const [farmerData, setFarmerData] = useState(null);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail"); // Get logged-in email
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const currentFarmer = storedUsers.find(user => user.email === userEmail && user.role === "farmer");

    console.log("Retrieved Farmer Data:", currentFarmer);
    
    if (currentFarmer) {
      setFarmerData(currentFarmer);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userType");
    localStorage.removeItem("userEmail");
    alert("You have logged out!");
    navigate("/login");
  };

  const goToDashboard = () => {
    navigate("/farmer-dashboard");
  };


  return (
    <div className="farmer-profile-container">
      <h2>Farmer Profile</h2>
      {farmerData ? (
        <div className="farmer-info">
          <p><strong>Name:</strong> {farmerData.name}</p>
          <p><strong>Email:</strong> {farmerData.email}</p>
          <p><strong>Location:</strong> {farmerData.location}</p>
          <p><strong>Phone:</strong> {farmerData.phone}</p>
        </div>
      ) : (
        <p>Loading farmer data...</p>
      )}
      <br></br>
      <button onClick={goToDashboard} className="dashboard-btn">Go to Dashboard</button>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default FarmerProfile;
