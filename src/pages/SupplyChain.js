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

  const handleTrack = async (order) => {
    const destLat = parseFloat(order.location?.latitude);
    const destLng = parseFloat(order.location?.longitude);

    if (!destLat || !destLng) {
      alert("Invalid buyer location coordinates.");
      console.error("Buyer location invalid:", order.location);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const destination = {
          lat: destLat,
          lng: destLng,
        };

        console.log("Origin:", origin);
        console.log("Destination:", destination);

        try {
          const directionsService = new window.google.maps.DirectionsService();
          const result = await directionsService.route({
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          });
          setDirections(result);
        } catch (error) {
          console.error("Directions request failed:", error);
          alert("Unable to find route between origin and destination.");
        }
      },
      () => alert("Failed to get current location.")
    );
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
      await sendSMS(
        phone,
        `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.\n👨‍🌾 Farmer: ${farmerName}, 📞 ${farmerPhone}`
      );
      const buyerEmail = order.email;
      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status is now: ${newStatus}.\n\n👨‍🌾 Farmer: ${farmerName}\n📞 Contact: ${farmerPhone}\n\nThanks,\nFarmers Market`
        );
      }
      alert("✅ Status updated & buyer notified.");
    } catch (error) {
      console.error("Notification error:", error);
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
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
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
                  <button
                    onClick={() => handleDelete(order.id)}
                    style={{ backgroundColor: "red", color: "white" }}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="map-container">
          {directions && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
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
