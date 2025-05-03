import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Make sure the path is correct
import { collection, onSnapshot } from "firebase/firestore"; // Firestore functions
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplyChainOrders"), (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(fetchedOrders);
      setLoading(false);
    });

    // Cleanup function to stop listening to Firestore updates when the component is unmounted
    return () => unsubscribe();
  }, []);

  return (
    <div style={styles.container}>
      <h2>🚜 Supply Chain Management</h2>
      {loading ? (
        <div className="spinner">Loading...</div>
      ) : (
        <div style={styles.mapContainer}>
          {/* Google Map */}
          <LoadScript googleMapsApiKey="AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo">
            <GoogleMap
              mapContainerStyle={styles.mapContainerStyle}
              center={{ lat: 12.9716, lng: 77.5946 }} // Default center, can be dynamic
              zoom={10}
            >
              {orders.map((order) => (
                <Marker
                  key={order.id}
                  position={order.location} // Use order location for marker
                  title={order.crop}
                />
              ))}
            </GoogleMap>
          </LoadScript>

          {/* Order Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Transport</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.crop}</td>
                  <td>{order.buyer}</td>
                  <td style={styles.status[order.status]}>{order.status}</td>
                  <td>{order.transport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ✅ Inline CSS for Styling
const styles = {
  container: {
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  mapContainer: {
    width: "100%",
    height: "400px",
    marginBottom: "20px",
  },
  mapContainerStyle: {
    width: "100%",
    height: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  status: {
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
};

export default SupplyChain;
