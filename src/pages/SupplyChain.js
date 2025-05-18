import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";
import { useAuth } from "../auth";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const user = useAuth();

  // Farmer details fetched from Firebase
  const [farmerName, setFarmerName] = useState("");
  const [farmerLocationName, setFarmerLocationName] = useState(""); // city/area name
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [useAutoDetect, setUseAutoDetect] = useState(true); // default to auto detect

  useEffect(() => {
    // Fetch farmer info from Firestore based on user email
    if (!user?.email) return;

    const fetchFarmer = async () => {
      const farmersRef = collection(db, "farmers");
      const q = query(farmersRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const farmerData = querySnapshot.docs[0].data();
        setFarmerName(farmerData.name || "");
        setFarmerLocationName(farmerData.location || "");
        setManualLocationInput(farmerData.location || "");
      }
    };

    fetchFarmer();
  }, [user]);

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

  // Helper to geocode city/area name to lat/lng
  const geocodeLocation = (locationName) =>
    new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: locationName }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject("Geocode failed: " + status);
        }
      });
    });

  const handleTrack = async (order) => {
    if (!order.location?.latitude || !order.location?.longitude) {
      alert("Invalid buyer location.");
      return;
    }

    try {
      let origin;

      if (useAutoDetect && navigator.geolocation) {
        // Use browser geolocation
        origin = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => reject("Failed to get current location.")
          );
        });
      } else {
        // Use manual city/area input geocoding
        if (!manualLocationInput) {
          alert("Please enter your location.");
          return;
        }
        origin = await geocodeLocation(manualLocationInput);
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
    } catch (error) {
      alert(error);
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      // Notify buyer
      const phone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;
      await sendSMS(
        phone,
        `📦 Hi ${order.buyer}, your order (${order.orderId}) status is now: ${newStatus}. Seller: ${farmerName}`
      );

      const buyerEmail = user?.email;
      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status has been updated to: ${newStatus}.\nSeller: ${farmerName}\n\nThanks,\nFarmers Market`
        );
      }

      // Notify other farmers except current user
      const farmersRef = collection(db, "farmers");
      const q = query(farmersRef, where("email", "!=", user?.email));
      const farmersSnapshot = await getDocs(q);
      for (const farmerDoc of farmersSnapshot.docs) {
        const farmer = farmerDoc.data();
        const farmerPhone = farmer.contact.startsWith("+91") ? farmer.contact : `+91${farmer.contact}`;
        const farmerEmail = farmer.email;

        await sendSMS(
          farmerPhone,
          `🚜 Farmer ${farmerName} updated order ${order.orderId} status to: ${newStatus}.`
        );

        if (farmerEmail) {
          await sendEmail(
            farmerEmail,
            "Order Status Update Notification",
            `Hello ${farmer.name || "Farmer"},\n\nFarmer ${farmerName} has updated order ${order.orderId} status to: ${newStatus}.\n\nBest,\nFarmers Market`
          );
        }
      }

      alert("✅ Status updated & notifications sent.");
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div style={{ maxWidth: 900, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
        <h2>🚚 Supply Chain Tracking</h2>

        <div style={{ marginBottom: 20 }}>
          <div>
            <strong>Farmer Name:</strong> {farmerName || "Loading..."}
          </div>
          <div>
            <label>
              <input
                type="radio"
                checked={useAutoDetect}
                onChange={() => setUseAutoDetect(true)}
              />{" "}
              Auto Detect Location
            </label>
            <label style={{ marginLeft: 20 }}>
              <input
                type="radio"
                checked={!useAutoDetect}
                onChange={() => setUseAutoDetect(false)}
              />{" "}
              Enter Location Manually
            </label>
          </div>

          {!useAutoDetect && (
            <input
              type="text"
              placeholder="Enter city or area name"
              value={manualLocationInput}
              onChange={(e) => setManualLocationInput(e.target.value)}
              style={{ marginTop: 10, padding: 5, width: "60%" }}
            />
          )}
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
