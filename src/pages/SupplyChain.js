import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your actual API key

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transportLocations, setTransportLocations] = useState({}); // Holds selected transport points

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplyChainOrders"), (querySnapshot) => {
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "supplyChainOrders", orderId), {
        status: newStatus,
      });
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const assignTransport = async (orderId, lat, lng) => {
    try {
      await updateDoc(doc(db, "supplyChainOrders", orderId), {
        transportLocation: { latitude: lat, longitude: lng },
        transport: "Assigned",
      });
      setTransportLocations((prev) => ({
        ...prev,
        [orderId]: { lat, lng },
      }));
      alert("Transport assigned");
    } catch (error) {
      console.error("Failed to assign transport", error);
    }
  };

  const handleMapClick = (orderId, e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    assignTransport(orderId, lat, lng);
  };

  const renderPolyline = (order) => {
    const origin = order.originLocation;
    const transport = order.transportLocation;
    const dest = order.location;

    const path = [];

    if (origin) path.push({ lat: origin.latitude, lng: origin.longitude });
    if (transport) path.push({ lat: transport.latitude, lng: transport.longitude });
    if (dest) path.push({ lat: dest.latitude, lng: dest.longitude });

    return path.length >= 2 ? (
      <Polyline
        path={path}
        options={{
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        }}
      />
    ) : null;
  };

  return (
    <div style={styles.container}>
      <h2>🚚 Supply Chain Management</h2>
      {loading ? (
        <div className="spinner">Loading...</div>
      ) : (
        <>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={styles.mapContainerStyle}
              center={{ lat: 12.9716, lng: 77.5946 }}
              zoom={7}
            >
              {orders.map((order) => (
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
                  {order.location && (
                    <Marker
                      position={{
                        lat: order.location.latitude,
                        lng: order.location.longitude,
                      }}
                      label="Buyer"
                      icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    />
                  )}
                  {order.transportLocation && (
                    <Marker
                      position={{
                        lat: order.transportLocation.latitude,
                        lng: order.transportLocation.longitude,
                      }}
                      label="Transport"
                      icon="http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                    />
                  )}
                  {/* Draw route */}
                  {renderPolyline(order)}
                </React.Fragment>
              ))}

              {/* Allow setting transport location by clicking */}
              {orders.map((order) => (
                <GoogleMap
                  key={order.id}
                  onClick={(e) => handleMapClick(order.id, e)}
                />
              ))}
            </GoogleMap>
          </LoadScript>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Transport</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.crop}</td>
                  <td>{order.buyer}</td>
                  <td style={styles.status[order.status]}>{order.status}</td>
                  <td>{order.transport || "Not Assigned"}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  mapContainerStyle: {
    width: "100%",
    height: "500px",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  status: {
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Shipped: { color: "blue", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
};

export default SupplyChain;
