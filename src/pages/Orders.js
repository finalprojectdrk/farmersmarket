import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Orders.css";

const Orders = ({ currentUserName = "Default Buyer" }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "supplyChainOrders"), where("buyer", "==", currentUserName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userOrders = [];
      querySnapshot.forEach((doc) => userOrders.push({ id: doc.id, ...doc.data() }));
      setOrders(userOrders);
    });

    return () => unsubscribe();
  }, [currentUserName]);

  return (
    <div className="orders-container">
      <h2>📦 Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id} className="order-item">
              <div className="order-details">
                <h3>Crop: {order.crop}</h3>
                <p>Farmer: {order.farmer}</p>
                <p>Status: {order.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Orders;
