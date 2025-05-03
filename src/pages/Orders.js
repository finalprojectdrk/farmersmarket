import React, { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth"; // Custom hook
import "./Orders.css";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, "orders", user.uid, "items");
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const orderList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(orderList);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (orderId, status) => {
    try {
      const orderDoc = doc(db, "orders", user.uid, "items", orderId);
      await updateDoc(orderDoc, { status });
      alert(`Status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status.");
    }
  };

  return (
    <div className="orders-container">
      <h2>Your Orders</h2>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <img src={order.image} alt={order.name} className="order-image" />
              <div className="order-details">
                <h3>{order.name}</h3>
                <p>Quantity: {order.quantity}</p>
                <p>Total: ₹{order.total}</p>
                <p>Status: <strong>{order.status || "Pending"}</strong></p>
                {/* Optional: Let farmers update status */}
                {user.role === "farmer" && (
                  <div className="status-buttons">
                    <button onClick={() => updateStatus(order.id, "In Transit")}>Mark In Transit</button>
                    <button onClick={() => updateStatus(order.id, "Delivered")}>Mark Delivered</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
