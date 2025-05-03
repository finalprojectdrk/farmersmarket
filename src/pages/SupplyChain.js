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
  const [farmerLocation, setFarmerLocation] = useState({}); // Holds selected farmer location
  const [manualLocation, setManualLocation] = useState(""); // Holds manual farmer location input

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

  // Update farmer's location in Firestore
  const updateFarmerLocation = async (orderId, lat, lng) => {
    try {
      await updateDoc(doc(db, "supplyChainOrders", orderId), {
        originLocation: { latitude: lat, longitude: lng },
      });
      alert("Farmer location updated");
    } catch (error) {
      console.error("Failed to update farmer location", error);
    }
  };

  const handleLocationInput = (address, orderId) => {
    getCoordinatesFromAddress(address).then((location) => {
      setFarmerLocation(location);
      updateFarmerLocation(orderId, location.lat, location.lng);
    });
  };

  const getCoordinatesFromAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();

    try {
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === "OK") {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            resolve({ lat, lng });
          } else {
            reject("Geocode was not successful: " + status);
          }
        });
      });
      return results;
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return { lat: null, lng: null }; // Handle case where coordinates are not found
    }
  };

  const handleGetLocation = (orderId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFarmerLocation({ lat: latitude, lng: longitude });
          updateFarmerLocation(orderId, latitude, longitude);
        },
        (error) => {
          console.error("Error detecting location:", error);
          alert("Unable to detect location, please enter it manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
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
                  {renderPolyline(order)}
                </React.Fragment>
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
                    <button onClick={() => handleGetLocation(order.id)}>Get Farmer Location</button>
                    <input
                      type="text"
                      placeholder="Enter Farmer Location"
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      onBlur={() => handleLocationInput(manualLocation, order.id)}
                    />
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
