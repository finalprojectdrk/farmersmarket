import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import { useAuth } from "../auth";
import "./SupplyChain.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const user = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "supplyChainOrders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    });

    return () => unsub();
  }, []);

  const handleTrack = async (order) => {
    if (!order.location?.latitude || !order.location?.longitude) {
      alert("Invalid buyer location.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        const destination = {
          lat: order.location.latitude,
          lng: order.location.longitude,
        };

        const directionsService = new window.google.maps.DirectionsService();
        const result = await directionsService.route({
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        setDirections(result);
      },
      () => alert("Failed to get current location.")
    );
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    // Notify buyer
    try {
      const phone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;
      await sendSMS(phone, `📦 Hi ${order.buyer}, your order (${order.orderId}) status is now: ${newStatus}`);

      const buyerEmail = user?.email;
      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status has been updated to: ${newStatus}.\n\nThanks,\nFarmers Market`
        );
      }

      alert("✅ Status updated & buyer notified.");
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="supplychain-container">
        <h2>🚚 Supply Chain Tracking</h2>
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <img src={order.image} alt={order.crop} width={80} height={80} />
              <div><strong>Order ID:</strong> {order.orderId}</div>
              <div><strong>Crop:</strong> {order.crop}</div>
              <div><strong>Quantity:</strong> {order.quantity}</div>
              <div><strong>Buyer:</strong> {order.buyer}</div>
              <div><strong>Contact:</strong> {order.contact}</div>
              <div><strong>Payment:</strong> {order.payment}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div className="order-buttons">
                <button onClick={() => handleTrack(order)}>📍 Track</button>
                <button onClick={() => handleStatusUpdate(order, "In Transit")}>🚚 In Transit</button>
                <button onClick={() => handleStatusUpdate(order, "Delivered")}>✅ Delivered</button>
              </div>
            </div>
          ))}
        </div>
        <div className="map-container">
          {directions && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={directions.routes[0].overview_path[0]}
              zoom={10}
            >
              <DirectionsRenderer directions={directions} />
            </GoogleMap>
          )}
        </div>
      </div>
    </LoadScript>
  );
};

export default SupplyChain;
