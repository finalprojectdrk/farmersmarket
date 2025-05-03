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

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your API key

const SupplyChain = ({ currentUserRole = "farmer" }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressInputs, setAddressInputs] = useState({});
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supplyChainOrders"),
      (querySnapshot) => {
        const fetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(fetchedOrders);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });
    alert("Status updated.");
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Delete this delivered order?")) {
      await deleteDoc(doc(db, "supplyChainOrders", orderId));
      alert("Order deleted.");
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
      alert(`${fieldName} location updated.`);
    } else {
      alert("Invalid address.");
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

  const renderPolyline = (order) => {
    const points = [];

    if (order.originLocation)
      points.push({
        lat: order.originLocation.latitude,
        lng: order.originLocation.longitude,
      });

    if (order.location)
      points.push({
        lat: order.location.latitude,
        lng: order.location.longitude,
      });

    return points.length >= 2 ? (
      <Polyline
        path={points}
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
      <h2>🌾 Supply Chain Management</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
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
                <tr key={order.id}>
                  <td>{order.crop}</td>
                  <td>{order.buyer}</td>
                  <td style={styles.status[order.status]}>{order.status}</td>
                  <td>
                    <input
                      type="text"
                      placeholder="Farmer address"
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
    padding: "20px",
    background: "#f0f4f8",
    borderRadius: "8px",
    fontFamily: "Arial, sans-serif",
  },
  mapStyle: {
    width: "100%",
    height: "500px",
    marginTop: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
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
    cursor: "pointer",
    borderRadius: "4px",
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
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Shipped: { color: "blue", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
};

export default SupplyChain;
