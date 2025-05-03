import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase"; // Import Firebase db configuration
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    name: "",
    address: "",
    contact: "",
    payment: "COD",
  });

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleOrderConfirm = async () => {
    try {
      // Add order to Firestore (Orders collection)
      await addDoc(collection(db, "orders"), {
        ...details,
        status: "Pending",
        createdAt: new Date(),
      });

      // Add corresponding order to supplyChainOrders collection for tracking
      await addDoc(collection(db, "supplyChainOrders"), {
        crop: "Sample Crop", // Replace with dynamic product information
        buyer: details.name,
        status: "Pending",
        transport: "Not assigned", // This will be updated later when assigned
        location: {
          lat: 12.9716, // Replace with actual buyer's location (lat)
          lng: 77.5946, // Replace with actual buyer's location (lng)
        },
        address: details.address,
      });

      alert("Order Placed Successfully!");
      localStorage.removeItem("orders"); // Clear cart after placing order
      navigate("/products"); // Redirect back to products
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("Something went wrong while placing your order.");
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
      <input type="text" name="address" placeholder="Delivery Address" onChange={handleChange} required />
      <input type="text" name="contact" placeholder="Contact Number" onChange={handleChange} required />
      
      <select name="payment" onChange={handleChange}>
        <option value="COD">Cash on Delivery</option>
        <option value="UPI">UPI Payment</option>
        <option value="Card">Debit/Credit Card</option>
      </select>

      <button onClick={handleOrderConfirm} className="confirm-button">
        Confirm Order
      </button>
    </div>
  );
};

export default Checkout;
