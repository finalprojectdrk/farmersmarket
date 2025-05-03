import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { LoadScript } from "@react-google-maps/api";
import "./Checkout.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const Checkout = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({ name: "", address: "", contact: "", payment: "COD" });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("orders")) || [];
    setCart(stored);
  }, []);

  const getCoordinatesFromAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          resolve({
            latitude: results[0].geometry.location.lat(),
            longitude: results[0].geometry.location.lng(),
          });
        } else {
          reject("Geocoding failed: " + status);
        }
      });
    });
  };

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleLocation = async () => {
    if (!details.address) return alert("Enter address first");
    try {
      const coords = await getCoordinatesFromAddress(details.address);
      setLocation(coords);
      alert("📍 Location set!");
    } catch (err) {
      alert("❌ Failed to get location");
    }
  };

  const handleOrderConfirm = async () => {
    if (!details.name || !details.address || !details.contact) return alert("Please fill all fields");
    if (!location.latitude) return alert("Please fetch location");

    setLoading(true);
    try {
      await Promise.all(
        cart.map((item) =>
          addDoc(collection(db, "supplyChainOrders"), {
            ...details,
            buyer: details.name,
            crop: item.name,
            farmer: item.farmer,
            location,
            status: "Pending",
            transport: "Not Assigned",
            createdAt: new Date(),
          })
        )
      );
      localStorage.removeItem("orders");
      alert("✅ Orders placed!");
      navigate("/products");
    } catch (e) {
      console.error(e);
      alert("❌ Order failed");
    }
    setLoading(false);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="checkout-container">
        <h2>🧾 Checkout</h2>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="address" placeholder="Delivery Address" onChange={handleChange} required />
        <input name="contact" placeholder="Contact" onChange={handleChange} required />
        <select name="payment" onChange={handleChange}>
          <option value="COD">Cash on Delivery</option>
          <option value="UPI">UPI</option>
        </select>
        <button onClick={handleLocation}>📍 Get Location</button>
        <button onClick={handleOrderConfirm} disabled={loading}>
          {loading ? "Placing..." : "Confirm Order"}
        </button>
      </div>
    </LoadScript>
  );
};

export default Checkout;
