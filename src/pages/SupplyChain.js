import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualAddress, setManualAddress] = useState({});
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllFarmersPhones = async () => {
    const phones = [];
    try {
      const farmersSnapshot = await getDocs(collection(db, "farmers"));
      farmersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.phone) phones.push(data.phone);
      });
    } catch (error) {
      console.error("Fetch farmers error:", error);
    }
    return phones;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });

      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const trackingUrl = `https://your-app-domain.com/track?id=${orderId}`;

      const emailPayload = {
        to: order.buyerEmail,
        subject: `Order ${newStatus}`,
        message: `Hi ${order.buyer}, your order (${order.crop}) status is now "${newStatus}". Track here: ${trackingUrl}`,
      };

      const smsToBuyerPayload = {
        phone: order.buyerPhone,
        message: `Order (${order.crop}) is now "${newStatus}". Track here: ${trackingUrl}`,
      };

      await fetch("/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });

      await fetch("/sendSMS", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smsToBuyerPayload),
      });

      const farmerPhones = await fetchAllFarmersPhones();
      const broadcastMessage = `Order (${order.crop}) is "${newStatus}" by farmer ${currentUser.name}.`;

      await Promise.all(
        farmerPhones.map((phone) =>
          fetch("/sendSMS", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, message: broadcastMessage }),
          })
        )
      );
    } catch (error) {
      console.error("Status change error:", error);
    }
  };

  const deleteOrder = async (orderId) => {
    if (
      window.confirm("Delete this order? Only delivered orders should be deleted.")
    ) {
      await deleteDoc(doc(db, "orders", orderId));
    }
  };

  const getCoordinatesFromAddress = async (address) => {
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

  const saveManualLocation = async (orderId) => {
    const address = manualAddress[orderId];
    if (!address) {
      alert("Enter an address");
      return;
    }
    const latLng = await getCoordinatesFromAddress(address);
    if (latLng) {
      await updateDoc(doc(db, "orders", orderId), {
        originAddress: address,
        originLocation: {
          latitude: latLng.lat(),
          longitude: latLng.lng(),
        },
      });
      alert("Location saved");
    } else {
      alert("Invalid address");
    }
  };

  const renderPolyline = (order) => {
    const points = [];
    if (order.originLocation)
      points.push({
        lat: order.originLocation.latitude,
        lng: order.originLocation.longitude,
      });
    if (order.trackingLocation)
      points.push({
        lat: order.trackingLocation.latitude,
        lng: order.trackingLocation.longitude,
      });
    if (order.location)
      points.push({ lat: order.location.latitude, lng: order.location.longitude });

    if (points.length >= 2) {
      return (
        <Polyline
          path={points}
          options={{ strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 4 }}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Supply Chain Dashboard</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <tr key={order.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <img
                      src={order.imageURL || "https://via.placeholder.com/60"}
                      alt={order.crop}
                      style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                    />
                    <span>{order.crop}</span>
                  </td>
                  <td>{order.buyer}</td>
                  <td
                    style={{ fontWeight: "bold", color: getStatusColor(order.status) }}
                  >
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
                    <button onClick={() => saveManualLocation(order.id)}>Save Location</button>
                    <p style={{ fontSize: 12, marginTop: 4 }}>
                      {order.originAddress || "No address set"}
                    </p>
                  </td>
                  <td>
                    {currentUser.role === "farmer" ? (
                      <>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option>Pending</option>
                          <option>In Transit</option>
                          <option>Shipped</option>
                          <option>Delivered</option>
                        </select>
                        {order.status === "Delivered" && (
                          <button
                            onClick={() => deleteOrder(order.id)}
                            style={{ marginLeft: 10, color: "red" }}
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      <span>{order.status}</span>
                    )}
                    <button
                      onClick={() =>
                        setTrackingOrderId(trackingOrderId === order.id ? null : order.id)
                      }
                      style={{ marginLeft: 10 }}
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
            mapContainerStyle={{ height: "400px", width: "100%", marginTop: 20 }}
            center={{ lat: 11.1271, lng: 78.6569 }}
            zoom={7}
          >
            {(() => {
              const order = orders.find((o) => o.id === trackingOrderId);
              if (!order) return null;

              const origin = order.originLocation
                ? { lat: order.originLocation.latitude, lng: order.originLocation.longitude }
                : null;
              const tracking = order.trackingLocation
                ? { lat: order.trackingLocation.latitude, lng: order.trackingLocation.longitude }
                : null;
              const destination = order.location
                ? { lat: order.location.latitude, lng: order.location.longitude }
                : null;

              return (
                <>
                  {origin && <Marker position={origin} label="Farmer" />}
                  {tracking && <Marker position={tracking} label="Transport" />}
                  {destination && <Marker position={destination} label="Buyer" />}
                  {renderPolyline(order)}
                </>
              );
            })()}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

function getStatusColor(status) {
  switch (status) {
    case "Pending":
      return "orange";
    case "In Transit":
      return "blue";
    case "Shipped":
      return "purple";
    case "Delivered":
      return "green";
    default:
      return "black";
  }
}

export default SupplyChain;
