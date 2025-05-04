// ... top imports remain unchanged
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with yours

const SupplyChain = ({ currentUserRole = "farmer" }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressInputs, setAddressInputs] = useState({});
  const [trackingOrderIds, setTrackingOrderIds] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supplyChainOrders"),
      (snapshot) => {
        const orderData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(orderData);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const trackingUrl = `https://your-app-domain.com/track?id=${orderId}`;

    try {
      await fetch("/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.buyerEmail,
          subject: `Order ${newStatus}`,
          message: `Hi ${order.buyer}, your crop order (${order.crop}) is now "${newStatus}".\nTrack here: ${trackingUrl}`,
        }),
      });
    } catch (err) {
      console.error("Email error:", err);
    }

    try {
      await fetch("/sendSMS", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: order.buyerPhone,
          message: `Order (${order.crop}) is "${newStatus}". Track: ${trackingUrl}`,
        }),
      });
    } catch (err) {
      console.error("SMS error:", err);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure to delete this delivered order?")) {
      await deleteDoc(doc(db, "supplyChainOrders", orderId));
    }
  };

  const handleAddressInput = (e, orderId, field) => {
    setAddressInputs((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: e.target.value },
    }));
  };

  const geocodeAndSave = async (orderId, address, fieldName) => {
    const { lat, lng } = await getCoordinatesFromAddress(address);
    if (lat && lng) {
      await updateDoc(doc(db, "supplyChainOrders", orderId), {
        [`${fieldName}Address`]: address,
        [`${fieldName}Location`]: { latitude: lat, longitude: lng },
      });
    } else {
      alert("Invalid address or not found.");
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          resolve({ lat: null, lng: null });
        }
      });
    });
  };

  const detectAndSaveLocation = (orderId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await updateDoc(doc(db, "supplyChainOrders", orderId), {
          originLocation: { latitude, longitude },
          originAddress: "Detected Location",
        });
      });
    } else {
      alert("Geolocation is not supported.");
    }
  };

  const toggleTracking = (orderId) => {
    setTrackingOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

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

    if (points.length >= 2) {
      return (
        <Polyline
          path={points}
          options={{
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <h2>🌾 Supply Chain Dashboard</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Buyer</th>
                  <th>Status</th>
                  <th>Farmer Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
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
                      <td>{order.buyer || "N/A"}</td>
                      <td style={styles.status[order.status] || {}}>
                        {order.status}
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter your address"
                          value={
                            addressInputs[order.id]?.origin ||
                            order.originAddress ||
                            ""
                          }
                          onChange={(e) =>
                            handleAddressInput(e, order.id, "origin")
                          }
                          style={styles.input}
                        />
                        <button
                          onClick={() =>
                            geocodeAndSave(
                              order.id,
                              addressInputs[order.id]?.origin,
                              "origin"
                            )
                          }
                          style={styles.saveBtn}
                        >
                          Save
                        </button>
                        <br />
                        <button
                          onClick={() => detectAndSaveLocation(order.id)}
                          style={{ ...styles.saveBtn, marginTop: "5px", backgroundColor: "#009688" }}
                        >
                          Detect Location
                        </button>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>

                        {currentUserRole === "farmer" &&
                          order.status === "Delivered" && (
                            <button
                              onClick={() => deleteOrder(order.id)}
                              style={styles.deleteBtn}
                            >
                              Delete
                            </button>
                          )}

                        <button
                          onClick={() => toggleTracking(order.id)}
                          style={styles.trackBtn}
                        >
                          {trackingOrderIds[order.id] ? "Hide Map" : "Track"}
                        </button>
                      </td>
                    </tr>

                    {trackingOrderIds[order.id] && (
                      <tr>
                        <td colSpan="5">
                          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                            <GoogleMap
                              mapContainerStyle={styles.mapStyle}
                              center={{
                                lat:
                                  order.originLocation?.latitude ||
                                  order.location?.latitude ||
                                  20,
                                lng:
                                  order.originLocation?.longitude ||
                                  order.location?.longitude ||
                                  78,
                              }}
                              zoom={6}
                            >
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
                                  label="Buyer"
                                  icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                                />
                              )}
                              {renderPolyline(order)}
                            </GoogleMap>
                          </LoadScript>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
  },
  table: {
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  input: {
    padding: "5px",
    width: "150px",
    marginRight: "5px",
  },
  saveBtn: {
    padding: "5px 8px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteBtn: {
    marginLeft: "10px",
    backgroundColor: "red",
    color: "white",
    padding: "5px 8px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  trackBtn: {
    marginLeft: "10px",
    backgroundColor: "#2196F3",
    color: "white",
    padding: "5px 8px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  status: {
    Pending: { color: "orange", fontWeight: "bold" },
    "In Transit": { color: "blue", fontWeight: "bold" },
    Shipped: { color: "purple", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
  mapStyle: {
    height: "400px",
    width: "100%",
    marginTop: "20px",
    borderRadius: "10px",
  },
  cropImage: {
    width: "60px",
    height: "60px",
    borderRadius: "8px",
    objectFit: "cover",
    marginBottom: "5px",
  },
  imageBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

export default SupplyChain;
