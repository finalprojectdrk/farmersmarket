// src/App.js

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserSelection from "./pages/UserSelection";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import BuyerProfile from "./pages/BuyerProfile";
import FarmerProfile from "./pages/FarmerProfile";
import AddProduct from "./pages/AddProduct";
import SupplyChain from "./pages/SupplyChain";
import RealTimePrices from "./pages/RealTimePrices";
import Transactions from "./pages/Transactions";

// 🔥 Private Route Wrapper
const PrivateRoute = ({ element, isLoggedIn }) => {
  return isLoggedIn ? element : <Navigate to="/login" />;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");
  const [userType, setUserType] = useState(localStorage.getItem("userType") || "");

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setUserType(localStorage.getItem("userType") || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserType("");
    alert("You have logged out!");
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} userType={userType} handleLogout={handleLogout} />
      <Routes>

        {/* --- Public Routes --- */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />} />
        <Route path="/register" element={<Register />} />

        {/* --- Private Route (Logged in users only) --- */}
        <Route path="/user-selection" element={<PrivateRoute element={<UserSelection setUserType={setUserType} />} isLoggedIn={isLoggedIn} />} />

        {/* --- Farmer Routes --- */}
        {userType === "farmer" && (
          <>
            <Route path="/farmer-dashboard" element={<PrivateRoute element={<FarmerDashboard />} isLoggedIn={isLoggedIn} />} />
            <Route path="/farmer-profile" element={<PrivateRoute element={<FarmerProfile />} isLoggedIn={isLoggedIn} />} />
            <Route path="/add-product" element={<PrivateRoute element={<AddProduct />} isLoggedIn={isLoggedIn} />} />
            <Route path="/supply-chain" element={<PrivateRoute element={<SupplyChain />} isLoggedIn={isLoggedIn} />} />
            <Route path="/real-time-prices" element={<PrivateRoute element={<RealTimePrices />} isLoggedIn={isLoggedIn} />} />
          </>
        )}

        {/* --- Buyer Routes --- */}
        {userType === "buyer" && (
          <>
            <Route path="/buyer-dashboard" element={<PrivateRoute element={<BuyerDashboard />} isLoggedIn={isLoggedIn} />} />
            <Route path="/products" element={<PrivateRoute element={<Products />} isLoggedIn={isLoggedIn} />} />
            <Route path="/product/:id" element={<PrivateRoute element={<ProductDetail />} isLoggedIn={isLoggedIn} />} />
            <Route path="/orders" element={<PrivateRoute element={<Orders />} isLoggedIn={isLoggedIn} />} />
            <Route path="/checkout" element={<PrivateRoute element={<Checkout />} isLoggedIn={isLoggedIn} />} />
            <Route path="/buyer-profile" element={<PrivateRoute element={<BuyerProfile />} isLoggedIn={isLoggedIn} />} />
            <Route path="/transactions" element={<PrivateRoute element={<Transactions />} isLoggedIn={isLoggedIn} />} />
          </>
        )}

        {/* --- Redirect all unknown paths to Home --- */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
