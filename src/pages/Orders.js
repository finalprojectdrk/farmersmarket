import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../auth";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(updatedOrders);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user]);

  return (
    <div className="orders-container">
      <h2>Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders placed yet.</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <h3>Order {order.id}</h3>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} - ₹{item.price}/kg
                  </li>
                ))}
              </ul>
              <p>Status: {order.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
