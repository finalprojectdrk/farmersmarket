import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../auth"; // Assuming useAuth gives you the logged-in user
import "./Orders.css";

const Orders = () => {
  const user = useAuth(); // Assuming useAuth returns the logged-in user
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log("User not logged in");
      return;
    }

    const ordersRef = collection(db, "supplyChainOrders");
    const q = query(ordersRef, where("buyer", "==", user.uid)); // Query for orders by buyer UID

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.log("No orders found");
      }
      const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched orders:", ordersData); // Check fetched data
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="orders-container">
      <h2>Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>{order.crop}</h3>
              <p>Farmer: {order.farmer}</p>
              <p>Status: {order.status}</p>
              <p>Created At: {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
