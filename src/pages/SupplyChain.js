// ... (imports remain unchanged)
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
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import { useAuth } from "../auth";
import "./SupplyChain.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";
const LIBRARIES = ["places"];

const isValidMobile = (phone) => {
  const regex = /^\+91[6-9]\d{9}$/;
  return regex.test(phone);
};

const formatPhone = (phone) => {
  let formatted = phone.replace(/\D/g, ""); // Remove non-digit
  if (formatted.length === 10 && /^[6-9]/.test(formatted)) {
    return `+91${formatted}`;
  } else if (formatted.length === 12 && formatted.startsWith("91")) {
    return `+${formatted}`;
  } else if (formatted.startsWith("+91") && formatted.length === 13) {
    return formatted;
  }
  return null; // Invalid
};

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
        setFarmerInfo(querySnapshot.docs[0].data());
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

    const aCalc =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
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
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            () => {
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
      alert("❌ Buyer too far for road travel.");
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
      alert("❌ Route generation failed.");
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
      const farmerName = farmerInfo?.name || "Unknown Farmer";
      const farmerPhone = formatPhone(farmerInfo?.phone || "");

      const buyerPhone = formatPhone(order.Phone || "");

      // ✅ Notify Buyer
      if (isValidMobile(buyerPhone)) {
        await sendSMS(
          buyerPhone,
          `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.\n👨‍🌾 Shipped by: ${farmerName}, 📞 ${farmerPhone || "N/A"}`
        );
      }

      if (order.email) {
        await sendEmail(
          order.email,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) is now: ${newStatus}.\nShipped by: ${farmerName}\n📞 ${farmerPhone || "N/A"}\n\nThanks,\nFarmers Market`
        );
      }

      // ✅ Notify all Farmers
      const farmerQuery = query(collection(db, "users"), where("role", "==", "farmer"));
      const farmerSnap = await getDocs(farmerQuery);

      for (const docSnap of farmerSnap.docs) {
        const farmer = docSnap.data();
        const phone = formatPhone(farmer.phone || "");
        if (isValidMobile(phone)) {
          await sendSMS(
            phone,
            `📦 Order ${order.orderId} has been updated to "${newStatus}" by ${farmerName}.`
          );
        }
      }

      alert("✅ Status updated & notifications sent.");
    } catch (error) {
      console.error("❌ Notification error:", error);
      alert("❌ Notification sending failed.");
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
      <div className="supplychain-container">
        <h2>🚚 Supply Chain Tracking</h2>
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
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
              />
              <button onClick={() => detectFarmerLocation(order.id)}>📍 Detect Location</button>

              <div className="order-buttons">
                <button onClick={() => handleTrack(order)}>🗺️ Track</button>
                <button onClick={() => handleStatusUpdate(order, "Shipped")}>📦 Shipped</button>
                <button onClick={() => handleStatusUpdate(order, "In Transit")}>🚚 In Transit</button>
                <button onClick={() => handleStatusUpdate(order, "Delivered")}>✅ Delivered</button>
                {order.status === "Delivered" && (
                  <button onClick={() => handleDelete(order.id)} style={{ backgroundColor: "red", color: "white" }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {directions && (
          <div className="map-container">
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
