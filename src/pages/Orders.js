import React, { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import "./Orders.css";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    if (!user || !user.uid) {
      console.log("User is not authenticated");
      return;
    }

    const ordersRef = collection(db, "orders", user.uid, "items");

    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        console.log("Snapshot received:", snapshot); // Log the entire snapshot

        // Check if the snapshot has valid documents
        if (snapshot && snapshot.docs) {
          const orderList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Mapped orders:", orderList); // Log mapped orders
          setOrders(orderList);
        } else {
          console.warn("No documents found in snapshot");
          setOrders([]); // Set orders to empty array if no data is found
        }
        setLoading(false); // Set loading to false after snapshot is processed
      },
      (error) => {
        console.error("Error fetching orders:", error); // Log any error
        alert("Failed to load orders. Please try again.");
        setLoading(false); // Set loading to false even on error
      }
    );

    // Cleanup function when component unmounts
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

      {loading ? (
        <p>Loading orders...</p> // Show loading state while fetching data
      ) : orders.length === 0 ? (
        <p>No orders found.</p> // If no orders are available
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

                {/* Optional role check */}
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
