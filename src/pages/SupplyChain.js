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
  const [addressInputs, setAddressInputs] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplyChainOrders"), (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(fetchedOrders);
      setLoading(false);
    });

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
    if (order.transportLocation)
      points.push({
        lat: order.transportLocation.latitude,
        lng: order.transportLocation.longitude,
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
          strokeColor: "#FF5733",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        }}
      />
    ) : null;
  };

  return (
    <div style={styles.container}>
      <h2>🚜 Supply Chain Tracking</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={styles.mapStyle}
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

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Origin Address</th>
                <th>Transport Address</th>
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
                        addressInputs[order.id]?.origin || order.originAddress || ""
                      }
                      onChange={(e) =>
                        handleAddressInput(e, order.id, "origin")
                      }
                    />
                    <button
                      onClick={() =>
                        geocodeAndSave(
                          order.id,
                          addressInputs[order.id]?.origin,
                          "origin"
                        )
                      }
                    >
                      Save
                    </button>
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Transport address"
                      value={
                        addressInputs[order.id]?.transport ||
                        order.transportAddress ||
                        ""
                      }
                      onChange={(e) =>
                        handleAddressInput(e, order.id, "transport")
                      }
                    />
                    <button
                      onClick={() =>
                        geocodeAndSave(
                          order.id,
                          addressInputs[order.id]?.transport,
                          "transport"
                        )
                      }
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
                          style={{ marginLeft: "10px", color: "red" }}
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
    backgroundColor: "#f9f9f9",
  },
  mapStyle: {
    height: "500px",
    width: "100%",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
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
