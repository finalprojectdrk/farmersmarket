import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import "./Orders.css";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user?.email) return;

    const ordersQuery = query(
      collection(db, "supplyChainOrders"),
      where("buyerEmail", "==", user.email)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orderData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(orderData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="orders-container">
      <h2>🧾 My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <img src={order.image} alt={order.crop} className="order-image" />
              <div className="order-info">
                <h3>{order.crop}</h3>
                <p>Price: ₹{order.price}</p>
                <p>Qty: {order.quantity}</p>
                <p>Status: <strong>{order.status}</strong></p>
                <p>Transport: {order.transport}</p>
                <p>Order ID: {order.orderId}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
