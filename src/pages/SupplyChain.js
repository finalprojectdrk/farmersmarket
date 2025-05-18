// Updated SupplyChain.js with working SMS/email logic and image display

import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { GoogleMap, DirectionsRenderer, LoadScript } from "@react-google-maps/api";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import "./SupplyChain.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});
  const [farmerLocation, setFarmerLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ordersRef = collection(db, "supplyChainOrders");
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const orderList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(orderList);
    });
    return () => unsubscribe();
  }, []);

  const getCoordinates = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          resolve(results[0].geometry.location);
        } else {
          reject("Geocode error: " + status);
        }
      });
    });
  };

  const handleTrack = async (order) => {
    if (!farmerLocation) return alert("Enter your location first");
    try {
      const origin = await getCoordinates(farmerLocation);
      const destination = new window.google.maps.LatLng(
        order.location.latitude,
        order.location.longitude
      );
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections((prev) => ({ ...prev, [order.id]: result }));
          } else {
            alert("Directions request failed: " + status);
          }
        }
      );
    } catch (err) {
      alert("Tracking failed: " + err);
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    setLoading(true);
    try {
      const orderRef = doc(db, "supplyChainOrders", order.id);
      await updateDoc(orderRef, { status: newStatus });

      const trackingUrl = window.location.href;
      const buyerPhone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;

      await sendSMS(
        buyerPhone,
        `Hi ${order.buyer}, your order (${order.crop}) status is now \"${newStatus}\". Track here: ${trackingUrl}. Farmer: ${order.farmerName || "N/A"}, Mobile: ${order.farmerPhone || "N/A"}`
      );

      const farmersQuery = query(collection(db, "users"), where("role", "==", "farmer"));
      const farmersSnap = await getDocs(farmersQuery);

      await Promise.all(
        farmersSnap.docs.map((docSnap) => {
          const farmer = docSnap.data();
          const phone = farmer.phone?.startsWith("+91") ? farmer.phone : `+91${farmer.phone}`;
          return sendSMS(phone, `Order ${order.orderId} is now ${newStatus}.`);
        })
      );

      if (order.buyerEmail) {
        await sendEmail(
          order.buyerEmail,
          `Order ${order.orderId} Status Update`,
          `Hi ${order.buyer},\n\nYour order (${order.crop}) is now marked as \"${newStatus}\".\n\nTrack here: ${trackingUrl}`
        );
      }

      alert("Status updated and notifications sent");
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Error updating status");
    }
    setLoading(false);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="supply-chain-container">
        <h2>📦 Supply Chain Tracking</h2>

        <input
          placeholder="Enter Farmer Location (e.g. Coimbatore, TN)"
          value={farmerLocation}
          onChange={(e) => setFarmerLocation(e.target.value)}
        />

        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <img src={order.image} alt={order.crop} width={80} height={80} />
            <h4>{order.crop}</h4>
            <p>Buyer: {order.buyer}</p>
            <p>Phone: {order.contact}</p>
            <p>Status: {order.status}</p>
            <div>
              <button onClick={() => handleTrack(order)}>📍 Track</button>
              <button onClick={() => handleStatusUpdate(order, "In Transit")} disabled={loading}>
                🚚 Mark In Transit
              </button>
              <button onClick={() => handleStatusUpdate(order, "Delivered")} disabled={loading}>
                ✅ Mark Delivered
              </button>
            </div>
            {directions[order.id] && (
              <GoogleMap
                mapContainerStyle={{ height: "300px", width: "100%" }}
                center={directions[order.id].routes[0].overview_path[0]}
                zoom={10}
              >
                <DirectionsRenderer directions={directions[order.id]} />
              </GoogleMap>
            )}
          </div>
        ))}
      </div>
    </LoadScript>
  );
};

export default SupplyChain;
