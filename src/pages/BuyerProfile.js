import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Import Firestore configuration
import { doc, getDoc } from "firebase/firestore"; // Firebase Firestore functions
import { useAuth } from "../auth"; // Custom hook for Firebase authentication
import "./BuyerProfile.css";

const BuyerProfile = () => {
  const navigate = useNavigate();
  const [buyerData, setBuyerData] = useState(null);
  const user = useAuth(); // Custom hook to get the logged-in user

  useEffect(() => {
    const fetchBuyerData = async () => {
      if (user) {
        const buyerRef = doc(db, "users", user.uid); // Assuming your users are stored in a 'users' collection in Firestore
        try {
          const docSnap = await getDoc(buyerRef);
          if (docSnap.exists()) {
            setBuyerData(docSnap.data()); // Set the data of the current buyer
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.log("Error getting document:", error);
        }
      }
    };

    if (user) {
      fetchBuyerData();
    }
  }, [user]);

  const handleLogout = () => {
    // Clear user session (if using Firebase Auth)
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
      <br />
      <button onClick={goToDashboard} className="dashboard-btn">Go to Dashboard</button>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default BuyerProfile;
