import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BuyerProfile.css";

const BuyerProfile = () => {
  const navigate = useNavigate();
  const [buyerData, setBuyerData] = useState(null);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail"); // Get logged-in email
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const currentBuyer = storedUsers.find(user => user.email === userEmail && user.role === "buyer");

    console.log("Retrieved Buyer Data:", currentBuyer);
    
    if (currentBuyer) {
      setBuyerData(currentBuyer);
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
    navigate("/buyer-dashboard");
  };

  return (
    <div className="buyer-profile-container">
      <h2>Buyer Profile</h2>
      {buyerData ? (
        <div className="buyer-info">
          <p><strong>Name:</strong> {buyerData.name}</p>
          <p><strong>Email:</strong> {buyerData.email}</p>
          <p><strong>Location:</strong> {buyerData.location}</p>
          <p><strong>Phone:</strong> {buyerData.phone}</p>
        </div>
      ) : (
        <p>Loading buyer data...</p>
      )}
      <br></br>
      <button onClick={goToDashboard} className="dashboard-btn">Go to Dashboard</button>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default BuyerProfile;
