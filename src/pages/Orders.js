import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import {
  GoogleMap,
  DirectionsRenderer,
  LoadScript
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});
  const [showMap, setShowMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "supplyChainOrders"),
      where("buyerId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userOrders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(userOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const geocodeAddress = async (address) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      throw new Error("Geocoding failed: " + data.status);
    }
  };

  const trackRoute = async (order) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [order.id]: true }));

      if (!order?.location?.latitude || !order?.location?.longitude) {
        alert("❌ Missing buyer location.");
        return;
      }

      const dest = {
        lat: order.location.latitude,
        lng: order.location.longitude,
      };

      const origin = await geocodeAddress(order.farmerAddress);

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
            alert("❌ Failed to get directions");
            console.error("Directions request failed:", status);
          }
        }
      );
    } catch (error) {
      console.error("Error in geocoding or routing:", error);
      alert("❌ Unable to get route. Check console for details.");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div style={styles.container}>
        <h2 style={styles.title}>📦 Your Orders</h2>
        {orders.length === 0 ? (
          <p style={styles.noOrdersText}>No orders yet.</p>
        ) : (
          <div style={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <img
                  src={order.image}
                  alt={order.crop}
                  style={styles.orderImage}
                />
                <div style={styles.orderInfo}>
                  <h3 style={styles.orderTitle}>{order.crop}</h3>
                  <p style={styles.orderDetail}>
                    <strong>Order ID:</strong> {order.orderId}
                  </p>
                  <p style={styles.orderDetail}>
                    <strong>Status:</strong> {order.status}
                  </p>
                  <p style={styles.orderDetail}>
                    <strong>Quantity:</strong> {order.quantity}
                  </p>
                  <p style={styles.orderDetail}>
                    <strong>Price:</strong> ₹{order.price}
                  </p>
                  <p style={styles.orderDetail}>
                    <strong>Farmer Location:</strong>{" "}
                    {order.farmerAddress || "Not available"}
                  </p>
                  <button
                    onClick={() => trackRoute(order)}
                    style={styles.trackButton}
                    disabled={loadingMap[order.id]}
                  >
                    {loadingMap[order.id] ? "Loading..." : "📍 Live Track"}
                  </button>
                </div>
                {showMap[order.id] && directions[order.id] && (
                  <GoogleMap
                    mapContainerStyle={styles.mapContainer}
                    center={order.location}
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

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  noOrdersText: {
    fontSize: "1.2rem",
    color: "#777",
    textAlign: "center",
  },
  ordersList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "space-between",
  },
  orderCard: {
    width: "100%",
    maxWidth: "300px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
  },
  orderImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
  },
  orderInfo: {
    padding: "15px",
  },
  orderTitle: {
    margin: "10px 0",
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#333",
  },
  orderDetail: {
    margin: "5px 0",
    fontSize: "0.9rem",
    color: "#555",
  },
  trackButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px",
    cursor: "pointer",
    borderRadius: "5px",
    marginTop: "10px",
    fontSize: "1rem",
  },
  mapContainer: {
    width: "100%",
    height: "300px",
    marginTop: "10px",
  },
};

export default Orders;
