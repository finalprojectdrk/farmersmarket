import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import "./Orders.css";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Copy from supplyChainOrders to orders once per user
  const syncOrders = async () => {
    if (!user?.uid) return;

    const sourceRef = collection(db, "supplyChainOrders");
    const sourceQuery = query(sourceRef, where("buyerId", "==", user.uid));
    const sourceSnapshot = await getDocs(sourceQuery);

    const destRef = collection(db, "orders");

    for (const docSnap of sourceSnapshot.docs) {
      const destDocRef = doc(db, "orders", docSnap.id);
      await setDoc(destDocRef, docSnap.data(), { merge: true });
    }
  };

  useEffect(() => {
    if (!user || !user.uid) return;

    // Sync only once when component mounts
    syncOrders().then(() => {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("buyerId", "==", user.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orderList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(orderList);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching orders:", error);
          alert("Failed to load orders.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    });
  }, [user]);

  const updateStatus = async (orderId, status) => {
    try {
      const orderDoc = doc(db, "orders", orderId);
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
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const displayPrice =
              order.price && order.price > 0
                ? `₹${order.price}${order.unit ? "/" + order.unit : ""}`
                : "Not available";

            return (
              <div className="order-card" key={order.id}>
                {order.image && (
                  <img
                    src={order.image}
                    alt={order.name || order.crop}
                    className="order-image"
                  />
                )}
                <div className="order-details">
                  <h3>{order.crop}</h3>
                  <p>Quantity: {order.quantity}</p>
                  <p>Price: {displayPrice}</p>
                  <p>Status: <strong>{order.status || "Pending"}</strong></p>
                  <p>
                    Tracking:{" "}
                    <strong>
                      {order.tracking || "Tracking not available"}
                    </strong>
                  </p>

                  {user.role === "farmer" && (
                    <div className="status-buttons">
                      <button onClick={() => updateStatus(order.id, "In Transit")}>
                        Mark In Transit
                      </button>
                      <button onClick={() => updateStatus(order.id, "Delivered")}>
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
