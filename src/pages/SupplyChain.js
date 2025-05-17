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

// Import your sendSMS utility (make sure this is your working SMS function)
import { sendSMS } from "../utils/sms";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your own

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 10.8505,
  lng: 76.2711,
};

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

  const sendSMSToBuyer = async (order, newStatus) => {
    const trackingUrl = `https://farmerssmarket.com/track?id=${order.id}`;

    // Format phone number with +91 prefix if missing
    const formattedPhone = order.contact?.startsWith("+91")
      ? order.contact
      : `+91${order.contact}`;

    const message = `Hi ${order.buyer}, your order (${order.crop}) status is now "${newStatus}". Track here: ${trackingUrl}. Farmer: ${order.farmerName}, Mobile: ${order.farmerPhone}`;

    try {
      await sendSMS(formattedPhone, message);
      console.log("SMS sent to buyer:", formattedPhone);
    } catch (err) {
      console.error("SMS to buyer error:", err);
    }
  };

  const notifyAllFarmers = async (orderId) => {
    try {
      await fetch("/notifyFarmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Order ID ${orderId} status has changed. Please check your dashboard.`,
        }),
      });
    } catch (err) {
      console.error("Notify farmers error:", err);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });

    // Send SMS to buyer with farmer details
    await sendSMSToBuyer(order, newStatus);

    // Notify all farmers about order ID status change
    await notifyAllFarmers(orderId);
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Delete this delivered order?")) {
      await deleteDoc(doc(db, "supplyChainOrders", orderId));
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    if (!address) return null;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
    return "";
  };

  const autoDetectAndSave = async (orderId) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoordinates(latitude, longitude);

        await updateDoc(doc(db, "supplyChainOrders", orderId), {
          farmerLocation: { lat: latitude, lng: longitude },
          farmerAddress: address,
        });
      },
      (error) => {
        alert("Unable to retrieve your location.");
        console.error(error);
      }
    );
  };

  const saveManualLocation = async (orderId) => {
    const address = manualAddress[orderId];
    if (!address) {
      alert("Please enter an address.");
      return;
    }
    const coords = await getCoordinatesFromAddress(address);
    if (!coords) {
      alert("Could not find coordinates for that address.");
      return;
    }
    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      farmerLocation: coords,
      farmerAddress: address,
    });
    alert("Farmer location updated.");
  };

  const renderPolyline = (order) => {
    if (
      order.farmerLocation &&
      order.buyerLocation &&
      order.farmerLocation.lat &&
      order.buyerLocation.lat
    ) {
      return (
        <Polyline
          path={[order.farmerLocation, order.buyerLocation]}
          options={{ strokeColor: "#007bff", strokeWeight: 3 }}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "1rem" }}>
      <h2>🚜 Supply Chain Dashboard</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "2rem",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f8f8" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Order ID
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Crop
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Buyer
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Buyer Contact
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Status
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Farmer Location
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Update Status
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Delete
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Track
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.id}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.crop}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.buyer}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.contact}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.status}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.farmerAddress || (
                      <>
                        <button
                          onClick={() => autoDetectAndSave(order.id)}
                          style={{ marginBottom: "4px" }}
                        >
                          Auto Detect Location
                        </button>
                        <br />
                        <input
                          type="text"
                          placeholder="Enter address"
                          value={manualAddress[order.id] || ""}
                          onChange={(e) =>
                            setManualAddress({
                              ...manualAddress,
                              [order.id]: e.target.value,
                            })
                          }
                          style={{ width: "80%", marginRight: "4px" }}
                        />
                        <button onClick={() => saveManualLocation(order.id)}>
                          Save
                        </button>
                      </>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.status === "Delivered" && (
                      <button onClick={() => deleteOrder(order.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() =>
                        setTrackingOrderId(
                          trackingOrderId === order.id ? null : order.id
                        )
                      }
                    >
                      {trackingOrderId === order.id ? "Hide" : "Track"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {trackingOrderId && (
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={
                  orders.find((o) => o.id === trackingOrderId)?.farmerLocation ||
                  center
                }
                zoom={8}
              >
                {orders
                  .filter((o) => o.id === trackingOrderId)
                  .map((order) => (
                    <React.Fragment key={order.id}>
                      {order.farmerLocation && (
                        <Marker
                          position={order.farmerLocation}
                          label="Farmer"
                          icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                          }}
                        />
                      )}
                      {order.buyerLocation && (
                        <Marker
                          position={order.buyerLocation}
                          label="Buyer"
                          icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
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

export default SupplyChain;
