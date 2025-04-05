import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(storedOrders);
  }, []);

  // ✅ Function to cancel an order
  const handleCancelOrder = (index) => {
    const updatedOrders = orders.filter((_, i) => i !== index);
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div className="orders-container">
      <h2>Your Cart</h2>
      {orders.length === 0 ? (
        <p>No items in the cart</p>
      ) : (
        <>
          <ul className="order-list">
            {orders.map((product, index) => (
              <li key={index} className="order-item">
                <img src={product.image} alt={product.name} className="order-image" />
                <div className="order-details">
                  <h3>{product.name}</h3>
                  <p>Price: {product.price}</p>
                  <p>Farmer: {product.farmer}</p>
                </div>
                <button className="cancel-button" onClick={() => handleCancelOrder(index)}>
                  Cancel
                </button>
              </li>
            ))}
          </ul>
          <button onClick={handleProceedToCheckout} className="checkout-button">
            Proceed to Checkout
          </button>
        </>
      )}
      <Link to="/products" className="back-button">Continue Shopping</Link>
    </div>
  );
};

export default Orders;
