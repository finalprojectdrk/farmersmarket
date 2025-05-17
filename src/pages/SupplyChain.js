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

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = ({ currentUserRole = "farmer" }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualAddress, setManualAddress] = useState({});
  const [trackingOrderId, setTrackingOrderId] = useState(null);

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
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });

    const trackingUrl = `https://farmerssmarket.com/track?id=${orderId}`;

    try {
      await fetch("/api/email", {
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
      await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: order.buyerPhone,
          message: `Order (${order.crop}) is "${newStatus}". Track: ${trackingUrl}`,
        }),
      });
    } catch (err) {
      console.error("SMS error:", err);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Delete this delivered order?")) {
      await deleteDoc(doc(db, "supplyChainOrders", orderId));
    }
  };

  const autoDetectAndSave = async (orderId) => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const address = await getAddressFromCoordinates(
          coords.latitude,
          coords.longitude
        );
        if (address) {
          await updateDoc(doc(db, "supplyChainOrders", orderId), {
            originAddress: address,
            originLocation: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          });
          alert("Auto location saved!");
        } else {
          alert("Could not detect address.");
        }
      },
      (err) => {
        alert("Location error.");
        console.error(err);
      }
    );
  };

  const saveManualLocation = async (orderId) => {
    const address = manualAddress[orderId];
    if (!address) return alert("Enter an address first.");

    const coords = await getCoordinatesFromAddress(address);
    if (coords) {
      await updateDoc(doc(db, "supplyChainOrders", orderId), {
        originAddress: address,
        originLocation: {
          latitude: coords.lat(),
          longitude: coords.lng(),
        },
      });
      alert("Manual location saved!");
    } else {
      alert("Could not geocode address.");
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    if (!window.google?.maps) return null;

    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          resolve(null);
        }
      });
    });
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    if (!window.google?.maps) return null;

    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve(null);
        }
      });
    });
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
      <h2>🚜 Supply Chain Dashboard</h2>

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
                    <td>{order.buyer || "N/A"}</td>
                    <td style={styles.status[order.status] || { fontWeight: "bold" }}>
                      {order.status}
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Enter address"
                        value={manualAddress[order.id] || ""}
                        onChange={(e) =>
                          setManualAddress((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        style={{ width: "100%", marginBottom: 5 }}
                      />
                      <button
                        onClick={() => saveManualLocation(order.id)}
                        style={styles.saveBtn}
                      >
                        Save Manual Location
                      </button>
                      <br />
                      <button
                        onClick={() => autoDetectAndSave(order.id)}
                        style={styles.detectBtn}
                      >
                        Auto Detect & Save
                      </button>
                      <p style={{ fontSize: "12px", marginTop: "5px" }}>
                        {order.originAddress || "Not set"}
                      </p>
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
                        />
                      )}
                      {order.location && (
                        <Marker
                          position={{
                            lat: order.location.latitude,
                            lng: order.location.longitude,
                          }}
                          label="Buyer"
                        />
                      )}
                      {order.trackingLocation && (
                        <Marker
                          position={{
                            lat: order.trackingLocation.latitude,
                            lng: order.trackingLocation.longitude,
                          }}
                          label="Transport"
                          icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                          }}
                        />
                      )}
                      {renderPolyline(order)}
                    </React.Fragment>
                  ))}
              </GoogleMap>
            </LoadScript>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 20,
  },
  imageBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  cropImage: {
    width: 60,
    height: 60,
    objectFit: "cover",
    borderRadius: 4,
  },
  status: {
    Pending: { color: "#F39C12", fontWeight: "bold" },
    "In Transit": { color: "#2980B9", fontWeight: "bold" },
    Shipped: { color: "#8E44AD", fontWeight: "bold" },
    Delivered: { color: "#27AE60", fontWeight: "bold" },
  },
  saveBtn: {
    padding: "5px 10px",
    backgroundColor: "#2980B9",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  detectBtn: {
    padding: "5px 10px",
    backgroundColor: "#27AE60",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  deleteBtn: {
    marginLeft: 8,
    padding: "5px 10px",
    backgroundColor: "#E74C3C",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  trackBtn: {
   
marginLeft: 8,
padding: "5px 10px",
backgroundColor: "#34495E",
color: "#fff",
border: "none",
borderRadius: 4,
cursor: "pointer",
},
mapStyle: {
width: "100%",
height: "400px",
marginTop: 20,
borderRadius: 8,
},
};

export default SupplyChain;
