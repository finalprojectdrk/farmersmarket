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
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";
import "./Orders.css";

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE";

const mapContainerStyle = {
  width: "100%",
  height: "200px",
  marginTop: "10px",
  borderRadius: "8px",
};

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingInputs, setTrackingInputs] = useState({});

  const syncOrders = async () => {
    if (!user?.uid) return;

    const sourceRef = collection(db, "supplyChainOrders");
    const sourceQuery = query(sourceRef, where("buyerId", "==", user.uid));
    const sourceSnapshot = await getDocs(sourceQuery);

    for (const docSnap of sourceSnapshot.docs) {
      const destDocRef = doc(db, "orders", docSnap.id);
      await setDoc(destDocRef, docSnap.data(), { merge: true });
    }
  };

  useEffect(() => {
    if (!user || !user.uid) return;

    syncOrders().then(() => {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("buyerId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(orderList);
        setLoading(false);
      });

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

  const handleTrackingChange = (orderId, value) => {
    setTrackingInputs((prev) => ({ ...prev, [orderId]: value }));
  };

  const updateTracking = async (orderId) => {
    try {
      const value = trackingInputs[orderId]?.trim();
      if (!value) return alert("Enter tracking info.");

      const orderDocRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderDocRef);
      const existingData = orderSnap.exists() ? orderSnap.data() : {};
      const prevHistory = existingData.trackingHistory || [];

      const newEntry = {
        message: value,
        timestamp: new Date(),
      };

      const updatedHistory = [...prevHistory, newEntry];

      await updateDoc(orderDocRef, {
        trackingHistory: updatedHistory,
      });

      alert("Tracking updated");
      setTrackingInputs((prev) => ({ ...prev, [orderId]: "" }));
    } catch (err) {
      console.error("Failed to update tracking:", err);
      alert("Error updating tracking info.");
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
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

              const loc = order.trackingLocation;

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

                    <p><strong>Tracking History:</strong></p>
                    <ul className="tracking-history">
                      {order.trackingHistory && order.trackingHistory.length > 0 ? (
                        order.trackingHistory.map((entry, idx) => (
                          <li key={idx}>
                            📍 {entry.message} <span className="timestamp">({new Date(entry.timestamp.seconds * 1000).toLocaleString()})</span>
                          </li>
                        ))
                      ) : (
                        <li>No tracking updates yet.</li>
                      )}
                    </ul>

                    {user.role === "farmer" && (
                      <>
                        <div className="status-buttons">
                          <button onClick={() => updateStatus(order.id, "In Transit")}>Mark In Transit</button>
                          <button onClick={() => updateStatus(order.id, "Delivered")}>Mark Delivered</button>
                        </div>

                        <div className="tracking-update">
                          <input
                            type="text"
                            placeholder="Enter tracking info"
                            value={trackingInputs[order.id] || ""}
                            onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                          />
                          <button onClick={() => updateTracking(order.id)}>Update Tracking</button>
                        </div>
                      </>
                    )}

                    {loc?.latitude && loc?.longitude && (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={{ lat: loc.latitude, lng: loc.longitude }}
                        zoom={14}
                      >
                        <Marker position={{ lat: loc.latitude, lng: loc.longitude }} />
                      </GoogleMap>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default Orders;
