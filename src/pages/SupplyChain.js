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

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your key
const LIBRARIES = ["places"];

// Function to format and validate phone numbers
const correctPhoneNumber = (number) => {
  if (!number) return null;
  const sanitized = number.toString().replace(/\D/g, "");

  // Ensure the number starts with '+91' for India or has 10 digits
  if (sanitized.startsWith("91") && sanitized.length === 12) {
    return `+${sanitized}`;
  } else if (sanitized.length === 10) {
    return `+91${sanitized}`;
  }

  // Log invalid phone numbers
  console.error(`Invalid phone number: ${number}`);
  return null; // Return null for invalid numbers
};

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const [farmerInfo, setFarmerInfo] = useState({});
  const [manualAddress, setManualAddress] = useState(""); // State to store manual address
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
    const aCalc = Math.sin(dLat / 2) ** 2 +
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

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      const buyerPhone = correctPhoneNumber(order.contact);
      const farmerName = farmerInfo?.name || "Farmer";
      const farmerPhone = correctPhoneNumber(farmerInfo?.phone || "");

      if (!buyerPhone || !farmerPhone) {
        console.error("Phone number is invalid");
        return;
      }

      const message = `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.\n👨‍🌾 Farmer: ${farmerName}, 📞 ${farmerPhone}`;
      if (!message) {
        console.error("Message is empty");
        return;
      }

      // Notify Buyer
      await sendSMS(buyerPhone, message);

      if (order.email) {
        await sendEmail(
          order.email,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) is now: ${newStatus}.\n👨‍🌾 Farmer: ${farmerName}\n📞 ${farmerPhone}\n\nThanks,\nFarmers Market`
        );
      }

      // Fetch all farmers from the "users" collection
      const farmersQuery = query(collection(db, "users"), where("role", "==", "farmer"));
      const farmerSnapshot = await getDocs(farmersQuery);

      const farmerNotifications = farmerSnapshot.docs.map(async (docSnap) => {
        const farmer = docSnap.data();
        const farmerPhone = correctPhoneNumber(farmer.phone);

        if (farmerPhone) {
          const farmerMessage = `📦 Order ${order.orderId} status updated to ${newStatus}. Buyer: ${order.buyer}, Address: ${order.address}.`;
          await sendSMS(farmerPhone, farmerMessage);
        } else {
          console.error(`Invalid phone number for farmer ${farmer.name}`);
        }
      });

      await Promise.all(farmerNotifications);
      alert("✅ Status updated & notifications sent to all farmers.");
    } catch (error) {
      console.error("Notification error:", error);
      alert("⚠️ Status updated, but failed to send notifications.");
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this delivered order from your view?")) {
      const orderRef = doc(db, "supplyChainOrders", orderId);
      await updateDoc(orderRef, { farmerDeleted: true });
      alert("✅ Order deleted from your view.");
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
      <div className="supply-chain">
        <h2>Orders</h2>

        {/* Manual Location Input */}
        <div className="location-section">
          <label>
            <strong>Enter Your Address:</strong>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter address"
            />
          </label>
        </div>

        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div><strong>Order ID:</strong> {order.orderId}</div>
              <div><strong>Buyer:</strong> {order.buyer}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div><strong>Location:</strong> {order.address}</div>

              <button onClick={() => handleTrack(order)}>Track Order</button>
              <button onClick={() => handleStatusUpdate(order, "Shipped")}>Mark as Shipped</button>
              <button onClick={() => handleDelete(order.id)}>Remove Order</button>

              {directions && (
                <GoogleMap
                  id="direction-map"
                  mapContainerStyle={{ width: "100%", height: "400px" }}
                  zoom={14}
                  center={directions.request.origin}
                >
                  <DirectionsRenderer directions={directions} />
                </GoogleMap>
              )}
            </div>
          ))}
        </div>
      </div>
    </LoadScript>
  );
};

export default SupplyChain;
