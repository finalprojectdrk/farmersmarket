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
import "./SupplyChain.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [manualLocationInput, setManualLocationInput] = useState("");
  const user = useAuth();

  useEffect(() => {
    // Fetch farmer info on mount
    const fetchCurrentFarmer = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("email", "==", user.email),
          where("role", "==", "farmer")
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const farmerData = snapshot.docs[0].data();
          setFarmerName(farmerData.name || "");
          setManualLocationInput(farmerData.location || "");
        }
      } catch (error) {
        console.error("Failed to fetch farmer info:", error);
      }
    };

    fetchCurrentFarmer();

    const unsub = onSnapshot(collection(db, "supplyChainOrders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    });

    return () => unsub();
  }, [user.email]);

  // Notify all other farmers except current user
  const notifyOtherFarmers = async (orderId, newStatus) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "farmer"));
      const farmersSnapshot = await getDocs(q);

      for (const farmerDoc of farmersSnapshot.docs) {
        const farmer = farmerDoc.data();
        if (farmer.email === user.email) continue; // skip current farmer

        const farmerPhone = farmer.contact.startsWith("+91")
          ? farmer.contact
          : `+91${farmer.contact}`;
        const farmerEmail = farmer.email;

        await sendSMS(
          farmerPhone,
          `🚜 Farmer ${farmerName} updated order ${orderId} status to: ${newStatus}.`
        );

        if (farmerEmail) {
          await sendEmail(
            farmerEmail,
            "Order Status Update Notification",
            `Hello ${farmer.name || "Farmer"},\n\nFarmer ${farmerName} has updated order ${orderId} status to: ${newStatus}.\n\nBest,\nFarmers Market`
          );
        }
      }
    } catch (error) {
      console.error("Error notifying other farmers:", error);
    }
  };

  const handleTrack = async (order) => {
    let origin = null;

    if (manualLocationInput) {
      // Geocode manual input address to lat/lng
      const geocoder = new window.google.maps.Geocoder();
      try {
        const results = await new Promise((resolve, reject) =>
          geocoder.geocode({ address: manualLocationInput }, (res, status) =>
            status === "OK" ? resolve(res) : reject(status)
          )
        );
        origin = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
      } catch {
        alert("Failed to geocode manual location input.");
        return;
      }
    } else if (navigator.geolocation) {
      // Use current location if manual location not entered
      origin = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject("Failed to get current location.")
        )
      ).catch((err) => {
        alert(err);
        return null;
      });
    }

    if (!origin) return;

    if (!order.location?.latitude || !order.location?.longitude) {
      alert("Invalid buyer location.");
      return;
    }

    const destination = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    const directionsService = new window.google.maps.DirectionsService();
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    setDirections(result);
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    // Notify buyer
    try {
      const phone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;
      await sendSMS(phone, `📦 Hi ${order.buyer}, your order (${order.orderId}) status is now: ${newStatus}.`);

      const buyerEmail = user?.email;
      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status has been updated to: ${newStatus}.\n\nThanks,\nFarmers Market`
        );
      }

      // Notify other farmers
      await notifyOtherFarmers(order.orderId, newStatus);

      alert("✅ Status updated & notifications sent.");
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="supplychain-container">
        <h2>🚚 Supply Chain Tracking</h2>

        <label>
          Enter your location (manual):
          <input
            type="text"
            value={manualLocationInput}
            onChange={(e) => setManualLocationInput(e.target.value)}
            placeholder="Enter address manually or leave empty for current location"
            style={{ width: "100%", marginBottom: "1em" }}
          />
        </label>

        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <img src={order.image} alt={order.crop} width={80} height={80} />
              <div><strong>Order ID:</strong> {order.orderId}</div>
              <div><strong>Crop:</strong> {order.crop}</div>
              <div><strong>Quantity:</strong> {order.quantity}</div>
              <div><strong>Buyer:</strong> {order.buyer}</div>
              <div><strong>Contact:</strong> {order.contact}</div>
              <div><strong>Payment:</strong> {order.payment}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div className="order-buttons">
                <button onClick={() => handleTrack(order)}>📍 Track</button>
                <button onClick={() => handleStatusUpdate(order, "In Transit")}>🚚 In Transit</button>
                <button onClick={() => handleStatusUpdate(order, "Delivered")}>✅ Delivered</button>
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
