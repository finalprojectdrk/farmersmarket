import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { LoadScript } from "@react-google-maps/api";
import "./Checkout.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your key

const Checkout = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    name: "",
    address: "",
    contact: "",
    payment: "COD",
  });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const getCoordinatesFromAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ latitude: lat, longitude: lng });
        } else {
          reject(`Geocode failed due to: ${status}`);
        }
      });
    });
  };

  const handleLocation = async () => {
    if (!details.address) {
      alert("Please enter the delivery address first.");
      return;
    }
    try {
      const coords = await getCoordinatesFromAddress(details.address);
      setLocation(coords);
      alert("📍 Location fetched successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to fetch location.");
    }
  };

  const handleOrderConfirm = async () => {
    if (!details.name || !details.address || !details.contact) {
      alert("Please fill all required fields.");
      return;
    }

    if (!location.latitude || !location.longitude) {
      alert("Please fetch location before confirming order.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "supplyChainOrders"), {
        ...details,
        location,
        status: "Pending",
        transport: "Not Assigned",
        createdAt: new Date(),
      });

      alert("✅ Order Placed Successfully!");
      localStorage.removeItem("orders");
      navigate("/products");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("❌ Failed to place order.");
    }
    setLoading(false);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="checkout-container">
        <h2>🧾 Checkout</h2>
        <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
        <input type="text" name="address" placeholder="Delivery Address" onChange={handleChange} required />
        <input type="text" name="contact" placeholder="Contact Number" onChange={handleChange} required />
        
        <select name="payment" onChange={handleChange}>
          <option value="COD">Cash on Delivery</option>
          <option value="UPI">UPI Payment</option>
          <option value="Card">Debit/Credit Card</option>
        </select>

        <button onClick={handleLocation} className="location-button">
          📍 Get Location
        </button>

        <button
          onClick={handleOrderConfirm}
          className="confirm-button"
          disabled={loading}
        >
          {loading ? "Placing Order..." : "Confirm Order"}
        </button>
      </div>
    </LoadScript>
  );
};

export default Checkout;
