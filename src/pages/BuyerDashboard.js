import React from "react";
import { Link, Navigate } from "react-router-dom";
import { FaShoppingCart, FaBox, FaWallet, FaTags } from "react-icons/fa"; // Import icons
import "./BuyerDashboard.css";

const BuyerDashboard = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole = localStorage.getItem("userType");

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== "buyer") {
    return <Navigate to="/user-selection" replace />;
  }

  return (
    <div className="buyer-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome, Buyer!</h2>
        <p>Find the best fresh produce at fair prices.</p>
      </div>

      {/* Secondary Navbar */}
      <div className="buyer-nav">
        <Link to="/products" className="buyer-nav-link">Products</Link>
        <Link to="/orders" className="buyer-nav-link">View Orders</Link>
        <Link to="/transactions" className="buyer-nav-link">Transactions</Link>
      </div>

      {/* Dashboard Sections with Icons */}
      <div className="dashboard-content">
        <Link to="/products" className="feature-box">
          <FaShoppingCart className="feature-icon" />
          <h3>Products</h3>
          <p>Check out top-selling fresh produce.</p>
        </Link>

        <Link to="/orders" className="feature-box">
          <FaBox className="feature-icon" />
          <h3>View Orders</h3>
          <p>Track your recent purchases.</p>
        </Link>

        <Link to="/transactions" className="feature-box">
          <FaWallet className="feature-icon" />
          <h3>Transactions</h3>
          <p>Manage your payments and history.</p>
        </Link>

        <Link to="/" className="feature-box">
          <FaTags className="feature-icon" />
          <h3>Offers</h3>
          <p>Grab the best deals available.</p>
        </Link>
      </div>
    </div>
  );
};

export default BuyerDashboard;
