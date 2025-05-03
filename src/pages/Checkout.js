import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Firebase config
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import "./Checkout.css";

// Checkout Component
const Checkout = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    name: "",
    address: "",
    contact: "",
    payment: "COD",
  });
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
  });

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  // Fetch coordinates for address using Google Geocoding API
  const handleLocation = async () => {
    const { lat, lng } = await getCoordinatesFromAddress(details.address);
    setLocation({ latitude: lat, longitude: lng });
  };

  // Confirm the order and save to Firestore
  const handleOrderConfirm = async () => {
    if (!location.latitude || !location.longitude) {
      alert("Please provide a valid address or enable location access.");
      return;
    }

    // Save order with location info in Firestore
    const orderRef = doc(db, "supplyChainOrders", "newOrderId");
    await setDoc(orderRef, {
      ...details,
      location, // Save latitude and longitude
      status: "Pending",
    });

    alert("Order Placed Successfully!");
    localStorage.removeItem("orders"); // Clear cart after placing order
    navigate("/products"); // Redirect back to products
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <input
        type="text"
        name="name"
        placeholder="Full Name"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="address"
        placeholder="Delivery Address"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="contact"
        placeholder="Contact Number"
        onChange={handleChange}
        required
      />
      
      <select name="payment" onChange={handleChange}>
        <option value="COD">Cash on Delivery</option>
        <option value="UPI">UPI Payment</option>
        <option value="Card">Debit/Credit Card</option>
      </select>

      {/* Button to trigger Geocoding */}
      <button onClick={handleLocation} className="location-button">
        Get Location
      </button>
      <button onClick={handleOrderConfirm} className="confirm-button">
        Confirm Order
      </button>
    </div>
  );
};

// Google Maps Geocoding API: Convert address to latitude and longitude
const getCoordinatesFromAddress = async (address) => {
  const geocoder = new window.google.maps.Geocoder();

  try {
    const results = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK") {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ lat, lng });
        } else {
          reject("Geocode was not successful for the following reason: " + status);
        }
      });
    });

    return { lat: results.lat, lng: results.lng };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return { lat: null, lng: null }; // Handle case where coordinates are not found
  }
};

export default Checkout;
