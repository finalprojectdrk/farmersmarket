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
  // Regex to validate Indian mobile numbers starting with +91 and followed by a digit between 6-9
  const regex = /^\+91[6-9]\d{9}$/;
  return regex.test(phone);
};

const isLandline = (phone) => {
  // Simple regex to check if the phone number is likely a landline
  const landlineRegex = /^(?:\+91|0)?(?:\d{2,4}-)?\d{6,8}$/;
  return landlineRegex.test(phone);
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

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      const farmerName = farmerInfo?.name || "Unknown Farmer";
      const farmerPhone = formatPhone(farmerInfo?.phone || "");

      const buyerPhone = formatPhone(order.Phone || "");

      // ✅ Notify Buyer (Only if it's a valid mobile number)
      if (isValidMobile(buyerPhone)) {
        await sendSMS(
          buyerPhone,
          `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.\n👨‍🌾 Shipped by: ${farmerName}, 📞 ${farmerPhone || "N/A"}`
        );
      } else if (isLandline(buyerPhone)) {
        console.log(`❌ Cannot send SMS to landline number: ${buyerPhone}`);
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

      const notifyFarmers = farmerSnap.docs.map(async (docSnap) => {
        const farmer = docSnap.data();
        const phone = formatPhone(farmer.phone || "");
        if (isValidMobile(phone)) {
          return sendSMS(
            phone,
            `📦 Order ${order.orderId} has been updated to "${newStatus}" by ${farmerName}.`
          );
        }
      });

      await Promise.all(notifyFarmers);
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
    <div className="supply-chain">
      <h2>Supply Chain Dashboard</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-item" key={order.id}>
            <h3>Order: {order.orderId}</h3>
            <p>Status: {order.status}</p>
            <button onClick={() => handleStatusUpdate(order, "Shipped")}>
              Mark as Shipped
            </button>
            <button onClick={() => handleDelete(order.id)}>Delete</button>
            <button onClick={() => handleTrack(order)}>Track</button>
            {directions && <DirectionsRenderer directions={directions} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplyChain;
