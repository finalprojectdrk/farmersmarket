import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { sendSMS } from "../utils/sms";
import { GoogleMap, DirectionsRenderer, LoadScript } from "@react-google-maps/api";
import "./SupplyChain.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const containerStyle = {
  width: "100%",
  height: "300px",
  marginTop: "10px",
};

const SupplyChain = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});

  // Fetch all orders where farmerId == current user id
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "supplyChainOrders"), where("farmerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const farmerOrders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(farmerOrders);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper: Notify all farmers when order status changes
  const notifyFarmers = async (orderId, newStatus, currentFarmerName) => {
    try {
      const farmersSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "farmer"))
      );
      farmersSnapshot.forEach(async (farmerDoc) => {
        const farmerData = farmerDoc.data();
        if (farmerData.phone) {
          const phone = farmerData.phone.startsWith("+91")
            ? farmerData.phone
            : `+91${farmerData.phone}`;
          const message = `Order ${orderId} has been shipped by farmer ${currentFarmerName}. Status: ${newStatus}`;
          await sendSMS(phone, message);
        }
      });
    } catch (error) {
      console.error("Error notifying farmers:", error);
    }
  };

  // Handle status update & notify buyer + all farmers
  const handleStatusChange = async (orderId, newStatus, buyerPhone, buyerName) => {
    try {
      const orderRef = doc(db, "supplyChainOrders", orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Notify buyer
      if (buyerPhone) {
        const cleanedPhone = buyerPhone.startsWith("+91") ? buyerPhone : `+91${buyerPhone}`;
        const buyerMessage = `Hi ${buyerName}, your order ${orderId} status has been updated to: ${newStatus}`;
        await sendSMS(cleanedPhone, buyerMessage);
      }

      // Notify all farmers
      const currentFarmerName = user?.displayName || "A farmer";
      await notifyFarmers(orderId, newStatus, currentFarmerName);

      alert(`✅ Order status updated and SMS sent to buyer and all farmers.`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("❌ Failed to update status.");
    }
  };

  // Track route: farmer's originLocation → buyer's location
  const trackRoute = (order) => {
    if (
      !order.originLocation?.latitude ||
      !order.originLocation?.longitude ||
      !order.location?.latitude ||
      !order.location?.longitude
    ) {
      alert("Missing location data for tracking.");
      return;
    }

    const origin = {
      lat: order.originLocation.latitude,
      lng: order.originLocation.longitude,
    };
    const destination = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections((prev) => ({ ...prev, [order.id]: result }));
        } else {
          alert("Failed to get directions.");
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="supplychain-container">
        <h2>📦 Orders You Are Handling</h2>
        {orders.length === 0 ? (
          <p>No orders assigned to you yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <img
                src={order.image}
                alt={order.crop}
                className="order-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-image.png"; // fallback image
                }}
              />
              <div className="order-info">
                <h3>{order.crop}</h3>
                <p>
                  <strong>Order ID:</strong> {order.orderId}
                </p>
                <p>
                  <strong>Status:</strong> {order.status}
                </p>
                <p>
                  <strong>Quantity:</strong> {order.quantity}
                </p>
                <p>
                  <strong>Price:</strong> ₹{order.price}
                </p>
                <p>
                  <strong>Buyer:</strong> {order.buyer}
                </p>
                <p>
                  <strong>Transport:</strong> {order.transport || "N/A"}
                </p>
                <button onClick={() => trackRoute(order)}>🗺️ Track Route</button>
              </div>

              {directions[order.id] && (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{
                    lat: order.originLocation.latitude,
                    lng: order.originLocation.longitude,
                  }}
                  zoom={8}
                >
                  <DirectionsRenderer directions={directions[order.id]} />
                </GoogleMap>
              )}

              <div className="status-buttons">
                {["In Transit", "Delivered"].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() =>
                      handleStatusChange(order.id, statusOption, order.buyerPhone, order.buyer)
                    }
                    className={order.status === statusOption ? "active-status" : ""}
                    disabled={order.status === "Delivered"}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </LoadScript>
  );
};

export default SupplyChain;
