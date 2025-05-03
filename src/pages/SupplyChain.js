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

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your key

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [originLocation, setOriginLocation] = useState(null); // Farmer's location

  // Get orders
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supplyChainOrders"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto detect farmer (origin) location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOriginLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Failed to get location:", error);
        alert("Please allow location access for tracking.");
      }
    );
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });
    alert(`Status updated to ${newStatus}`);
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      await deleteDoc(doc(db, "supplyChainOrders", orderId));
      alert("Order deleted successfully");
    }
  };

  // Get coordinates for buyer address
  const getCoordinatesFromAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          resolve({
            latitude: location.lat(),
            longitude: location.lng(),
          });
        } else {
          reject("Geocoding failed: " + status);
        }
      });
    });
  };

  const renderPolyline = (order) => {
    if (
      order.id !== selectedOrderId ||
      !originLocation ||
      !order.destinationCoords
    )
      return null;

    return (
      <Polyline
        path={[
          {
            lat: originLocation.latitude,
            lng: originLocation.longitude,
          },
          {
            lat: order.destinationCoords.latitude,
            lng: order.destinationCoords.longitude,
          },
        ]}
        options={{
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        }}
      />
    );
  };

  const handleTrack = async (order) => {
    try {
      const destinationCoords = await getCoordinatesFromAddress(order.address);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, destinationCoords } : o
        )
      );
      setSelectedOrderId(order.id);
    } catch (err) {
      console.error("Tracking failed:", err);
      alert("Could not geocode buyer address.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>🚜 Supply Chain Management</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={styles.mapContainerStyle}
              center={
                originLocation
                  ? {
                      lat: originLocation.latitude,
                      lng: originLocation.longitude,
                    }
                  : { lat: 12.9716, lng: 77.5946 }
              }
              zoom={7}
            >
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  {/* Origin Marker */}
                  {order.id === selectedOrderId && originLocation && (
                    <Marker
                      position={{
                        lat: originLocation.latitude,
                        lng: originLocation.longitude,
                      }}
                      label="Farmer"
                      icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    />
                  )}
                  {/* Destination Marker */}
                  {order.id === selectedOrderId && order.destinationCoords && (
                    <Marker
                      position={{
                        lat: order.destinationCoords.latitude,
                        lng: order.destinationCoords.longitude,
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

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.crop}</td>
                  <td>{order.name}</td>
                  <td style={styles.status[order.status]}>
                    {order.status}
                  </td>
                  <td>{order.address}</td>
                  <td>
                    <button onClick={() => handleTrack(order)}>Track</button>{" "}
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>{" "}
                    {order.status === "Delivered" && (
                      <button
                        onClick={() => deleteOrder(order.id)}
                        style={{ color: "red" }}
                      >
                        Delete
                      </button>
                    )}
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
    background: "#f4f4f4",
    borderRadius: "8px",
  },
  mapContainerStyle: {
    width: "100%",
    height: "400px",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    marginTop: "20px",
    borderCollapse: "collapse",
  },
  status: {
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Shipped: { color: "blue", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
};

export default SupplyChain;
