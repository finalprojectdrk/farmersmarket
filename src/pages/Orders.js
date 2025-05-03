import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Orders.css";

const Orders = ({ currentUserName = "Default Buyer" }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "supplyChainOrders"), where("buyer", "==", currentUserName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userOrders = [];
      querySnapshot.forEach((doc) => userOrders.push({ id: doc.id, ...doc.data() }));
      setOrders(userOrders);
      setLoading(false);  // Set loading to false once the orders are fetched
    });

    return () => unsubscribe();
  }, [currentUserName]);

  const handleStatusUpdate = (orderId, newStatus) => {
    // Function to update order status (can be used for Farmer updates)
    const orderRef = doc(db, "supplyChainOrders", orderId);
    updateDoc(orderRef, { status: newStatus })
      .then(() => alert(`Order status updated to ${newStatus}`))
      .catch((error) => alert("Error updating order status: " + error));
  };

  return (
    <div className="orders-container">
      <h2>📦 Your Orders</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id} className="order-item">
              <div className="order-details">
                <h3>Crop: {order.crop}</h3>
                <p>Farmer: {order.farmer}</p>
                <p>Status: {order.status}</p>
                {/* Example of a status update button */}
                {order.status !== "Delivered" && (
                  <button onClick={() => handleStatusUpdate(order.id, "Delivered")}>
                    Mark as Delivered
                  </button>
                )}
                {order.status === "Pending" && (
                  <button onClick={() => handleStatusUpdate(order.id, "In Transit")}>
                    Mark as In Transit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Orders;
