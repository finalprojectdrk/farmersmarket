import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import { useAuth } from "../auth";
// Removed CSS import since you want inline styles

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const user = useAuth();

  // Manual seller location state
  const [sellerLocation, setSellerLocation] = useState({ lat: "", lng: "" });
  const [sellerName, setSellerName] = useState(user?.displayName || "Farmer");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "supplyChainOrders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    });

    return () => unsub();
  }, []);

  const handleTrack = async (order) => {
    // Validate manual seller location input
    const lat = parseFloat(sellerLocation.lat);
    const lng = parseFloat(sellerLocation.lng);
    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter a valid seller latitude and longitude.");
      return;
    }

    if (!order.location?.latitude || !order.location?.longitude) {
      alert("Invalid buyer location.");
      return;
    }

    const origin = { lat, lng };
    const destination = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    const directionsService = new window.google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setDirections(result);
    } catch (error) {
      alert("Failed to calculate directions.");
      console.error(error);
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    // Notify buyer
    try {
      const phone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;
      await sendSMS(
        phone,
        `📦 Hi ${order.buyer}, your order (${order.orderId}) status is now: ${newStatus}. Seller: ${sellerName}`
      );

      const buyerEmail = user?.email;
      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status has been updated to: ${newStatus}.\nSeller: ${sellerName}\n\nThanks,\nFarmers Market`
        );
      }

      // Notify other farmers (except the seller) about this status update
      const farmersQuery = query(collection(db, "farmers"), where("email", "!=", user?.email));
      const farmerDocs = await getDocs(farmersQuery);
      farmerDocs.forEach(async (farmerDoc) => {
        const farmer = farmerDoc.data();
        const farmerPhone = farmer.contact.startsWith("+91") ? farmer.contact : `+91${farmer.contact}`;
        const farmerEmail = farmer.email;

        // SMS to other farmers
        await sendSMS(
          farmerPhone,
          `🚜 Farmer ${sellerName} updated order ${order.orderId} status to: ${newStatus}.`
        );

        // Email to other farmers
        if (farmerEmail) {
          await sendEmail(
            farmerEmail,
            "Order Status Update Notification",
            `Hello ${farmer.name || "Farmer"},\n\nFarmer ${sellerName} has updated order ${order.orderId} status to: ${newStatus}.\n\nBest,\nFarmers Market`
          );
        }
      });

      alert("✅ Status updated & notifications sent.");
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div
        style={{
          maxWidth: 900,
          margin: "auto",
          padding: 20,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>🚚 Supply Chain Tracking</h2>

        {/* Manual seller location input */}
        <div style={{ marginBottom: 20 }}>
          <label>
            Seller Name:{" "}
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              style={{ marginRight: 20 }}
            />
          </label>
          <label>
            Seller Latitude:{" "}
            <input
              type="text"
              value={sellerLocation.lat}
              onChange={(e) =>
                setSellerLocation((prev) => ({ ...prev, lat: e.target.value }))
              }
              placeholder="e.g. 12.9716"
              style={{ width: 100, marginRight: 20 }}
            />
          </label>
          <label>
            Seller Longitude:{" "}
            <input
              type="text"
              value={sellerLocation.lng}
              onChange={(e) =>
                setSellerLocation((prev) => ({ ...prev, lng: e.target.value }))
              }
              placeholder="e.g. 77.5946"
              style={{ width: 100 }}
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 30,
          }}
        >
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 15,
                width: 260,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={order.image}
                alt={order.crop}
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: 4, marginBottom: 10 }}
              />
              <div>
                <strong>Order ID:</strong> {order.orderId}
              </div>
              <div>
                <strong>Crop:</strong> {order.crop}
              </div>
              <div>
                <strong>Quantity:</strong> {order.quantity}
              </div>
              <div>
                <strong>Buyer:</strong> {order.buyer}
              </div>
              <div>
                <strong>Contact:</strong> {order.contact}
              </div>
              <div>
                <strong>Payment:</strong> {order.payment}
              </div>
              <div>
                <strong>Status:</strong> {order.status}
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handleTrack(order)}
                  style={{ marginRight: 8, cursor: "pointer" }}
                >
                  📍 Track
                </button>
                <button
                  onClick={() => handleStatusUpdate(order, "In Transit")}
                  style={{ marginRight: 8, cursor: "pointer" }}
                >
                  🚚 In Transit
                </button>
                <button
                  onClick={() => handleStatusUpdate(order, "Delivered")}
                  style={{ cursor: "pointer" }}
                >
                  ✅ Delivered
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 400, width: "100%" }}>
          {directions && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={directions.routes[0].overview_path[0]}
              zoom={10}
            >
              <DirectionsRenderer directions={directions} />
            </GoogleMap>
          )}
        </div>
      </div>
    </LoadScript>
  );
};

export default SupplyChain;
