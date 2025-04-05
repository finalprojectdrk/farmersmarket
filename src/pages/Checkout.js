import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleOrderConfirm = () => {
    alert("Order Placed Successfully!");
    localStorage.removeItem("orders"); // Clear cart after placing order
    navigate("/products"); // Redirect back to products
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
