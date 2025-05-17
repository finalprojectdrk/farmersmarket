import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { sendSMS } from "../utils/sms";
import { GoogleMap, DirectionsRenderer, LoadScript } from "@react-google-maps/api";
import "./Orders.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const containerStyle = {
  width: "100%",
  height: "300px",
  marginTop: "10px",
};

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "supplyChainOrders"), where("buyerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userOrders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(userOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStatusChange = async (orderId, newStatus, buyerContact, buyerName) => {
    const orderRef = doc(db, "supplyChainOrders", orderId);
    await updateDoc(orderRef, { status: newStatus });

    const cleanedPhone = buyerContact.startsWith("+91") ? buyerContact : `+91${buyerContact}`;
    const message = `Hi ${buyerName}, your order ${orderId} status has been updated to: ${newStatus}`;
    await sendSMS(cleanedPhone, message);

    alert(`📩 SMS sent to buyer. Order status changed to ${newStatus}`);
  };

  const trackRoute = async (order) => {
    if (!order?.location?.latitude || !order?.location?.longitude) {
      alert("Missing location data.");
      return;
    }

    const origin = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    const orderDoc = await getDoc(doc(db, "supplyChainOrders", order.id));
    const data = orderDoc.data();

    if (!data) {
      alert("Order data not found.");
      return;
    }

    const dest = {
      lat: data.location.latitude,
      lng: data.location.longitude,
    };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination: dest,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections((prev) => ({ ...prev, [order.id]: result }));
        } else {
          console.error("Directions request failed:", status);
          alert("❌ Failed to get directions");
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="orders-container">
        <h2>📦 Your Orders</h2>
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <img src={order.image} alt={order.crop} className="order-image" />
              <div className="order-info">
                <h3>{order.crop}</h3>
                <p><strong>Order ID:</strong> {order.orderId}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Price:</strong> ₹{order.price}</p>
                <p><strong>Transport:</strong> {order.transport}</p>
                <button onClick={() => trackRoute(order)}>🗺️ Track</button>
              </div>
              {directions[order.id] && (
                <GoogleMap mapContainerStyle={containerStyle} center={order.location} zoom={8}>
                  <DirectionsRenderer directions={directions[order.id]} />
                </GoogleMap>
              )}
              <div className="status-buttons">
                {["In Transit", "Delivered"].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      handleStatusChange(order.id, status, order.contact, order.buyer)
                    }
                    className={order.status === status ? "active-status" : ""}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </LoadScript>
  );
};

export default Orders;
