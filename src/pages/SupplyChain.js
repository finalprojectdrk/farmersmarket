import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your real key

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

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
      console.error("Error updating status:", error);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "supplyChainOrders", orderId));
        alert("Order deleted");
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleTrack = (order) => {
    setTrackingOrderId(order.id);

    if (order.originLocation && order.location) {
      setDirectionsResponse(null); // Reset first
    }
  };

  const handleDirectionsCallback = (response) => {
    if (response !== null && response.status === "OK") {
      setDirectionsResponse(response);
    } else {
      console.error("Directions request failed", response);
    }
  };

  const selectedOrder = orders.find((o) => o.id === trackingOrderId);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🚜 Supply Chain Tracker</h2>

      {loading ? (
        <div>Loading orders...</div>
      ) : (
        <>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={styles.map}
              center={{ lat: 12.9716, lng: 77.5946 }}
              zoom={6}
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
                </React.Fragment>
              ))}

              {selectedOrder &&
                selectedOrder.originLocation &&
                selectedOrder.location && (
                  <DirectionsService
                    options={{
                      destination: {
                        lat: selectedOrder.location.latitude,
                        lng: selectedOrder.location.longitude,
                      },
                      origin: {
                        lat: selectedOrder.originLocation.latitude,
                        lng: selectedOrder.originLocation.longitude,
                      },
                      travelMode: "DRIVING",
                    }}
                    callback={handleDirectionsCallback}
                  />
                )}

              {directionsResponse && (
                <DirectionsRenderer directions={directionsResponse} />
              )}
            </GoogleMap>
          </LoadScript>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.crop}</td>
                  <td>{order.buyer}</td>
                  <td style={styles.status[order.status] || {}}>{order.status}</td>
                  <td>
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
                    </select>

                    <button
                      style={styles.button}
                      onClick={() => handleTrack(order)}
                    >
                      Track
                    </button>

                    {order.status === "Delivered" && (
                      <button
                        style={{ ...styles.button, backgroundColor: "red" }}
                        onClick={() => deleteOrder(order.id)}
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
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f4f4",
  },
  heading: {
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  map: {
    width: "100%",
    height: "500px",
    marginBottom: "20px",
    borderRadius: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  status: {
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Shipped: { color: "blue", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
  button: {
    marginLeft: "8px",
    padding: "5px 10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default SupplyChain;
