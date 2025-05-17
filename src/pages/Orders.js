import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Your actual API key

const Orders = ({ currentUserEmail }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supplyChainOrders"),
      (snapshot) => {
        const orderData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((order) => order.buyerEmail === currentUserEmail); // filter by buyer
        setOrders(orderData);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUserEmail]);

  const renderPolyline = (order) => {
    const points = [];

    if (order.originLocation) {
      points.push({
        lat: order.originLocation.latitude,
        lng: order.originLocation.longitude,
      });
    }

    if (order.trackingLocation) {
      points.push({
        lat: order.trackingLocation.latitude,
        lng: order.trackingLocation.longitude,
      });
    }

    if (order.location) {
      points.push({
        lat: order.location.latitude,
        lng: order.location.longitude,
      });
    }

    return points.length >= 2 ? (
      <Polyline
        path={points}
        options={{
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        }}
      />
    ) : null;
  };

  return (
    <div style={styles.container}>
      <h2>📦 My Orders</h2>
      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Status</th>
                <th>Farmer Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div style={styles.imageBox}>
                      <img
                        src={order.imageURL || "https://via.placeholder.com/60"}
                        alt="Crop"
                        style={styles.cropImage}
                      />
                      <span>{order.crop || "N/A"}</span>
                    </div>
                  </td>
                  <td style={styles.status[order.status] || {}}>
                    {order.status}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {order.originAddress || "Not yet provided"}
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        setTrackingOrderId(
                          trackingOrderId === order.id ? null : order.id
                        )
                      }
                      style={styles.trackBtn}
                    >
                      {trackingOrderId === order.id ? "Hide Map" : "Track"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trackingOrderId && (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={styles.mapStyle}
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={6}
          >
            {orders
              .filter((order) => order.id === trackingOrderId)
              .map((order) => (
                <React.Fragment key={order.id}>
                  {order.originLocation && (
                    <Marker
                      position={{
                        lat: order.originLocation.latitude,
                        lng: order.originLocation.longitude,
                      }}
                      label="Farmer"
                      icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    />
                  )}
                  {order.trackingLocation && (
                    <Marker
                      position={{
                        lat: order.trackingLocation.latitude,
                        lng: order.trackingLocation.longitude,
                      }}
                      label="Tracking"
                      icon="http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                    />
                  )}
                  {order.location && (
                    <Marker
                      position={{
                        lat: order.location.latitude,
                        lng: order.location.longitude,
                      }}
                      label="You"
                      icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    />
                  )}
                  {renderPolyline(order)}
                </React.Fragment>
              ))}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

const styles = {
  container: { padding: "20px", background: "#f4f4f4" },
  table: {
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  trackBtn: {
    marginLeft: "5px",
    backgroundColor: "#6A1B9A",
    color: "white",
    padding: "5px 8px",
    border: "none",
    borderRadius: "4px",
  },
  status: {
    Pending: { color: "orange", fontWeight: "bold" },
    "In Transit": { color: "blue", fontWeight: "bold" },
    Shipped: { color: "purple", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
  mapStyle: {
    height: "500px",
    width: "100%",
    marginTop: "20px",
    borderRadius: "10px",
  },
  cropImage: {
    width: "60px",
    height: "60px",
    borderRadius: "8px",
    objectFit: "cover",
  },
  imageBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

export default Orders;
