import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { GoogleMap, DirectionsRenderer, LoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});
  const [showMap, setShowMap] = useState({});

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

  const trackRoute = (order) => {
    if (
      !order?.location?.latitude ||
      !order?.location?.longitude ||
      !order?.farmerLocation?.latitude ||
      !order?.farmerLocation?.longitude
    ) {
      alert("❌ Missing buyer or farmer location data. Please ensure both locations are set.");
      return;
    }

    const origin = {
      lat: order.farmerLocation.latitude,
      lng: order.farmerLocation.longitude,
    };

    const dest = {
      lat: order.location.latitude,
      lng: order.location.longitude,
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
          setShowMap((prev) => ({ ...prev, [order.id]: true }));
        } else {
          console.error("Directions request failed:", status);
          alert("❌ Failed to get directions");
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>📦 Your Orders</h2>
        {orders.length === 0 ? (
          <p style={{ fontSize: "1.2rem", color: "#777" }}>No orders yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "space-between" }}>
            {orders.map((order) => (
              <div key={order.id} style={{ width: "100%", maxWidth: "300px", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", backgroundColor: "#fff" }}>
                <img src={order.image} alt={order.crop} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                <div style={{ padding: "15px" }}>
                  <h3 style={{ margin: "10px 0", fontSize: "1.25rem", fontWeight: "600", color: "#333" }}>{order.crop}</h3>
                  <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#555" }}><strong>Order ID:</strong> {order.orderId}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#555" }}><strong>Status:</strong> {order.status}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#555" }}><strong>Quantity:</strong> {order.quantity}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#555" }}><strong>Price:</strong> ₹{order.price}</p>
                  <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#555" }}><strong>Farmer Location:</strong> {order.farmerAddress || "Not available"}</p>
                  <button onClick={() => trackRoute(order)} style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "10px", cursor: "pointer", borderRadius: "5px", marginTop: "10px", fontSize: "1rem" }}>📍 Live Track</button>
                </div>
                {showMap[order.id] && directions[order.id] && (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "300px", marginTop: "10px" }}
                    center={order.farmerLocation}
                    zoom={8}
                  >
                    <DirectionsRenderer directions={directions[order.id]} />
                  </GoogleMap>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default Orders;
