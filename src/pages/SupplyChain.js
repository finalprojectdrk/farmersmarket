// SupplyChain.js
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import { useAuth } from "../auth";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // replace with your actual API key
const LIBRARIES = ["places"];

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const [farmerInfo, setFarmerInfo] = useState({});
  const user = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "supplyChainOrders"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((order) => !order.farmerDeleted);
      setOrders(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchFarmer = async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "farmer"),
        where("email", "==", user?.email)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0].data();
        setFarmerInfo(doc);
      }
    };
    if (user?.email) fetchFarmer();
  }, [user]);

  const getDistance = (a, b) => {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;

    const sinDLat = Math.sin(dLat / 2) ** 2;
    const sinDLon = Math.sin(dLon / 2) ** 2;
    const aCalc = sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
    return R * c;
  };

  const handleTrack = async (order) => {
    const destination = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    let origin;
    if (order.farmerAddress) {
      try {
        const geoResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            order.farmerAddress
          )}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const geoData = await geoResponse.json();
        if (geoData.status === "OK" && geoData.results.length > 0) {
          const loc = geoData.results[0].geometry.location;
          origin = { lat: loc.lat, lng: loc.lng };
        } else {
          alert("❌ Could not geocode farmer address.");
          return;
        }
      } catch (err) {
        console.error("❌ Geocoding error:", err);
        alert("❌ Error fetching farmer location.");
        return;
      }
    } else {
      if (!navigator.geolocation) {
        alert("❌ Geolocation not supported by your browser.");
        return;
      }

      try {
        origin = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              resolve(coords);
            },
            (err) => {
              alert("❌ Failed to get your current location.");
              reject();
            }
          );
        });
      } catch {
        return;
      }
    }

    const distance = getDistance(origin, destination);
    if (distance > 2000) {
      alert("❌ Cannot generate route: Buyer is too far for road travel.");
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setDirections(result);
    } catch (error) {
      alert("❌ Route generation failed. Please try again.");
    }
  };

  const geocodeCoords = async (lat, lng) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    return data.results[0]?.formatted_address || `Lat: ${lat}, Lng: ${lng}`;
  };

  const handleManualLocationChange = async (orderId, address) => {
    const orderRef = doc(db, "supplyChainOrders", orderId);
    await updateDoc(orderRef, { farmerAddress: address });
  };

  const detectFarmerLocation = async (orderId) => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const address = await geocodeCoords(pos.coords.latitude, pos.coords.longitude);
      const orderRef = doc(db, "supplyChainOrders", orderId);
      await updateDoc(orderRef, { farmerAddress: address });
    });
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      const phone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;
      const farmerName = farmerInfo?.name || "Unknown Farmer";
      const farmerPhone = farmerInfo?.phone || "N/A";

      // Notify Buyer
      await sendSMS(
        phone,
        `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.\n👨‍🌾 Farmer: ${farmerName}, 📞 ${farmerPhone}`
      );

      if (order.email) {
        await sendEmail(
          order.email,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) is now: ${newStatus}.\n👨‍🌾 Farmer: ${farmerName}\n📞 ${farmerPhone}\n\nThanks,\nFarmers Market`
        );
      }

      // Notify Farmer (only when "Shipped")
      if (newStatus === "Shipped" && farmerInfo?.phone) {
        await sendSMS(
          `+91${farmerInfo.phone}`,
          `✅ You have marked order (${order.orderId}) as SHIPPED to ${order.buyer}`
        );
        await sendEmail(
          user?.email,
          "Order Shipped Confirmation",
          `You have shipped order ${order.orderId} to ${order.buyer}.\nAddress: ${order.address}\nContact: ${order.contact}`
        );
      }

      alert("✅ Status updated & notifications sent.");
    } catch (error) {
      console.error("Notification error:", error);
      alert("⚠️ Status updated, but failed to send notifications.");
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this delivered order from your view?")) {
      const orderRef = doc(db, "supplyChainOrders", orderId);
      await updateDoc(orderRef, { farmerDeleted: true });
      alert("✅ Order removed from your view.");
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h2 style={{ textAlign: "center", color: "#2d87f0" }}>🚚 Supply Chain Tracking</h2>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", marginBottom: "20px", width: "80%", backgroundColor: "#f9f9f9" }}>
              <img src={order.image} alt={order.crop} width={80} height={80} />
              <div><strong>Order ID:</strong> {order.orderId}</div>
              <div><strong>Crop:</strong> {order.crop}</div>
              <div><strong>Quantity:</strong> {order.quantity}</div>
              <div><strong>Buyer:</strong> {order.buyer}</div>
              <div><strong>Buyer Address:</strong> {order.address}</div>
              <div><strong>Contact:</strong> {order.contact}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div><strong>Farmer Address:</strong> {order.farmerAddress || "Not set"}</div>

              <input
                type="text"
                placeholder="Enter your location"
                value={order.farmerAddress || ""}
                onChange={(e) => handleManualLocationChange(order.id, e.target.value)}
                style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <button onClick={() => detectFarmerLocation(order.id)} style={{ padding: "8px 16px", backgroundColor: "#2d87f0", color: "#fff", border: "none", borderRadius: "4px" }}>
                📍 Detect Location
              </button>

              <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
                <button onClick={() => handleTrack(order)} style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}>
                  🗺️ Track
                </button>
                <button onClick={() => handleStatusUpdate(order, "Shipped")} style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}>
                  📦 Shipped
                </button>
                <button onClick={() => handleStatusUpdate(order, "In Transit")} style={{ padding: "8px 16px", backgroundColor: "#ffc107", color: "#fff", border: "none", borderRadius: "4px" }}>
                  🚚 In Transit
                </button>
                <button onClick={() => handleStatusUpdate(order, "Delivered")} style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}>
                  ✅ Delivered
                </button>
                {order.status === "Delivered" && (
                  <button onClick={() => handleDelete(order.id)} style={{ backgroundColor: "red", color: "white", padding: "8px 16px", borderRadius: "4px", border: "none" }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {directions && (
          <div style={{ marginTop: "20px" }}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={directions.routes[0].overview_path[0]}
              zoom={10}
            >
              <DirectionsRenderer directions={directions} />
            </GoogleMap>
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default SupplyChain;
