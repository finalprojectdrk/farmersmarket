import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../auth"; // Custom hook for current user
import "./Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const user = useAuth(); // Assuming user is authenticated

  useEffect(() => {
    if (!user) return;

    // Fetch orders for the current user
    const ordersRef = collection(db, "supplyChainOrders");
    const q = query(ordersRef, where("buyer", "==", user.uid)); // Assuming buyer's UID is stored

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    });

    return () => unsubscribe(); // Clean up the subscription
  }, [user]);

  if (!user) {
    return <div>Please login to view your orders.</div>;
  }

  return (
    <div className="orders-container">
      <h2>Your Orders</h2>
      <div className="orders-list">
        {orders.length === 0 ? (
          <p>You have no orders yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>Crop: {order.crop}</h3>
              <p><strong>Farmer:</strong> {order.farmer}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Payment:</strong> {order.payment}</p>
              <p><strong>Location:</strong> {order.address}</p>
              <p><strong>Created At:</strong> {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
