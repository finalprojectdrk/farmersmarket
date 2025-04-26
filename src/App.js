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

// Private Route Wrapper
const PrivateRoute = ({ children, isLoggedIn }) => {
  return isLoggedIn ? children : <Navigate to="/login" />;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const type = localStorage.getItem("userType") || "";
    setIsLoggedIn(loggedIn);
    setUserType(type);
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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Route - User Selection */}
        <Route path="/user-selection" element={
          <PrivateRoute isLoggedIn={isLoggedIn}>
            <UserSelection setUserType={setUserType} />
          </PrivateRoute>
        } />

        {/* Farmer Routes */}
        <Route path="/farmer-dashboard" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "farmer"}>
            <FarmerDashboard />
          </PrivateRoute>
        } />
        <Route path="/farmer-profile" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "farmer"}>
            <FarmerProfile />
          </PrivateRoute>
        } />
        <Route path="/add-product" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "farmer"}>
            <AddProduct />
          </PrivateRoute>
        } />
        <Route path="/supply-chain" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "farmer"}>
            <SupplyChain />
          </PrivateRoute>
        } />
        <Route path="/real-time-prices" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "farmer"}>
            <RealTimePrices />
          </PrivateRoute>
        } />

        {/* Buyer Routes */}
        <Route path="/buyer-dashboard" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <BuyerDashboard />
          </PrivateRoute>
        } />
        <Route path="/products" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <Products />
          </PrivateRoute>
        } />
        <Route path="/product/:id" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <ProductDetail />
          </PrivateRoute>
        } />
        <Route path="/orders" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <Orders />
          </PrivateRoute>
        } />
        <Route path="/checkout" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <Checkout />
          </PrivateRoute>
        } />
        <Route path="/buyer-profile" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <BuyerProfile />
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute isLoggedIn={isLoggedIn && userType === "buyer"}>
            <Transactions />
          </PrivateRoute>
        } />

        {/* Catch all unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
