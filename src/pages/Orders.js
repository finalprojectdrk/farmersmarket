import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { GoogleMap, DirectionsRenderer, LoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const Orders = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});
  const [showMap, setShowMap] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "supplyChainOrders"), where("buyerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userOrders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(userOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const trackRoute = (order) => {
    if (
      !order?.location?.latitude ||
      !order?.location?.longitude ||
      !order?.farmerLocation?.latitude ||
      !order?.farmerLocation?.longitude
    ) {
      alert("❌ Missing buyer or farmer location data. Please ensure both locations are set.");
      return;
    }

    const origin = {
      lat: order.farmerLocation.latitude,
      lng: order.farmerLocation.longitude,
    };

    const dest = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination: dest,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections((prev) => ({ ...prev, [order.id]: result }));
          setShowMap((prev) => ({ ...prev, [order.id]: true }));
        } else {
          console.error("Directions request failed:", status);
          alert("❌ Failed to get directions");
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="orders-container">
        <h2>📦 Your Orders</h2>
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <img src={order.image} alt={order.crop} className="order-image" />
                <div className="order-info">
                  <h3>{order.crop}</h3>
                  <p><strong>Order ID:</strong> {order.orderId}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Quantity:</strong> {order.quantity}</p>
                  <p><strong>Price:</strong> ₹{order.price}</p>
                  <p><strong>Farmer Location:</strong> {order.farmerAddress || "Not available"}</p>
                  <button onClick={() => trackRoute(order)}>📍 Live Track</button>
                </div>
                {showMap[order.id] && directions[order.id] && (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "300px", marginTop: "10px" }}
                    center={order.farmerLocation}
                    zoom={8}
                  >
                    <DirectionsRenderer directions={directions[order.id]} />
                  </GoogleMap>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>
        {`
          .orders-container {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .orders-list {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: space-between;
          }

          .order-card {
            width: 100%;
            max-width: 300px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background-color: #fff;
          }

          .order-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
          }

          .order-info {
            padding: 15px;
          }

          .order-info h3 {
            margin: 10px 0;
            font-size: 1.25rem;
          }

          .order-info p {
            margin: 5px 0;
            font-size: 0.9rem;
          }

          button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px;
            cursor: pointer;
            border-radius: 5px;
            margin-top: 10px;
          }

          button:hover {
            background-color: #45a049;
          }

          @media (max-width: 768px) {
            .order-card {
              width: 100%;
              max-width: 100%;
            }
          }

          @media (max-width: 480px) {
            .order-info h3 {
              font-size: 1rem;
            }
            .order-info p {
              font-size: 0.8rem;
            }
            button {
              font-size: 0.8rem;
              padding: 8px;
            }
          }
        `}
      </style>
    </LoadScript>
  );
};

export default Orders;
