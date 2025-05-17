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

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const containerStyle = {
  width: "100%",
  height: "300px",
  marginTop: "10px",
};

const SupplyChain = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "supplyChainOrders"), where("farmerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const farmerOrders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(farmerOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStatusChange = async (orderId, newStatus, farmerName) => {
    const orderRef = doc(db, "supplyChainOrders", orderId);
    await updateDoc(orderRef, { status: newStatus });

    // Notify all farmers about this status change
    const farmersQuery = query(collection(db, "users"), where("role", "==", "farmer"));
    const farmersSnapshot = await (await farmersQuery.get()).docs;

    farmersSnapshot.forEach(async (farmerDoc) => {
      const farmerData = farmerDoc.data();
      if (farmerData.phone) {
        const phoneNumber = farmerData.phone.startsWith("+91") ? farmerData.phone : `+91${farmerData.phone}`;
        const msg = `Order ${orderId} has been shipped by farmer ${farmerName}`;
        await sendSMS(phoneNumber, msg);
      }
    });
  };

  const trackRoute = async (order) => {
    if (!order.farmerLocation?.latitude || !order.farmerLocation?.longitude) {
      alert("Missing farmer location data.");
      return;
    }
    if (!order.buyerLocation?.latitude || !order.buyerLocation?.longitude) {
      alert("Missing buyer location data.");
      return;
    }

    const origin = {
      lat: order.farmerLocation.latitude,
      lng: order.farmerLocation.longitude,
    };
    const destination = {
      lat: order.buyerLocation.latitude,
      lng: order.buyerLocation.longitude,
    };

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
          console.error("Directions request failed:", status);
          alert("Failed to get directions");
        }
      }
    );
  };

  // Inline styles:
  const styles = {
    container: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "1rem",
    },
    orderCard: {
      display: "flex",
      flexWrap: "wrap",
      border: "1px solid #ddd",
      marginBottom: "1rem",
      padding: "1rem",
      borderRadius: "6px",
      background: "#fafafa",
      alignItems: "center",
    },
    orderImage: {
      width: "180px",
      height: "120px",
      objectFit: "cover",
      borderRadius: "4px",
      marginRight: "1rem",
      flexShrink: 0,
    },
    orderInfo: {
      flex: 1,
      minWidth: "200px",
    },
    statusButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "10px",
      flexWrap: "wrap",
    },
    button: {
      padding: "6px 12px",
      cursor: "pointer",
      borderRadius: "4px",
      border: "1px solid #4caf50",
      backgroundColor: "white",
      color: "#4caf50",
      fontWeight: "600",
      transition: "background-color 0.3s, color 0.3s",
    },
    activeButton: {
      backgroundColor: "#4caf50",
      color: "white",
    },
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div style={styles.container}>
        <h2>📦 Your Orders (Supply Chain)</h2>
        {orders.length === 0 ? (
          <p>No orders assigned to you yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} style={styles.orderCard}>
              <img
                src={order.image}
                alt={order.crop}
                style={styles.orderImage}
              />
              <div style={styles.orderInfo}>
                <h3>{order.crop}</h3>
                <p><strong>Order ID:</strong> {order.orderId}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Price:</strong> ₹{order.price}</p>
                <p><strong>Transport:</strong> {order.transport}</p>
                <button onClick={() => trackRoute(order)}>🗺️ Track</button>
              </div>
              {directions[order.id] && (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{
                    lat: order.farmerLocation.latitude,
                    lng: order.farmerLocation.longitude,
                  }}
                  zoom={8}
                >
                  <DirectionsRenderer directions={directions[order.id]} />
                </GoogleMap>
              )}
              <div style={styles.statusButtons}>
                {["In Transit", "Delivered"].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      handleStatusChange(order.id, status, user.displayName || "Farmer")
                    }
                    style={{
                      ...styles.button,
                      ...(order.status === status ? styles.activeButton : {}),
                    }}
                    disabled={order.status === "Delivered"}
                    title={order.status === "Delivered" ? "Cannot change status after delivery" : ""}
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

export default SupplyChain;
