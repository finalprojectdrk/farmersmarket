import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(collection(db, "supplyChainOrders"));
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() });
      });
      setOrders(fetchedOrders);
    };
    fetchOrders();
  }, []);

  const getCoordinatesFromAddress = async (address) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        return reject(new Error("Google Maps API not loaded"));
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(new Error("Geocode failed: " + status));
        }
      });
    });
  };

  const trackOrder = async (order) => {
    try {
      const origin =
        order.originLocation ||
        (await getCoordinatesFromAddress(order.farmerAddress));
      const destination =
        order.destinationLocation ||
        (await getCoordinatesFromAddress(order.buyerAddress));

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
            setSelectedOrder({ ...order, origin, destination });
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    } catch (error) {
      console.error("Error tracking order:", error);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const saveCurrentLocation = async (order) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      await updateDoc(doc(db, "supplyChainOrders", order.id), {
        originLocation: { lat: latitude, lng: longitude },
      });
      alert("Location saved!");
    });
  };

  return (
    <div>
      <h2>Supply Chain Orders</h2>
      {orders.map((order) => (
        <div key={order.id} style={styles.card}>
          <img src={order.imageURL} alt={order.productName} style={styles.image} />
          <h3>{order.productName}</h3>
          <p>Status: {order.status}</p>
          <p>Farmer: {order.farmerName}</p>
          <p>Buyer: {order.buyerName}</p>
          <p>From: {order.farmerAddress}</p>
          <p>To: {order.buyerAddress}</p>

          <button onClick={() => trackOrder(order)} style={styles.trackBtn}>
            Track
          </button>

          <button onClick={() => saveCurrentLocation(order)} style={styles.saveBtn}>
            Use My Location
          </button>

          {order.status !== "Delivered" && (
            <button onClick={() => updateStatus(order.id, "Delivered")} style={styles.updateBtn}>
              Mark as Delivered
            </button>
          )}
        </div>
      ))}

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        {selectedOrder && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={selectedOrder.origin}
            zoom={7}
          >
            <Marker
              position={selectedOrder.origin}
              icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />
            <Marker
              position={selectedOrder.destination}
              icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            />
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        )}
      </LoadScript>
    </div>
  );
};

const styles = {
  card: {
    border: "1px solid #ccc",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: 8,
  },
  trackBtn: {
    backgroundColor: "#2196f3",
    color: "#fff",
    padding: "8px 12px",
    margin: "5px",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  saveBtn: {
    backgroundColor: "#4caf50",
    color: "#fff",
    padding: "8px 12px",
    margin: "5px",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  updateBtn: {
    backgroundColor: "#f44336",
    color: "#fff",
    padding: "8px 12px",
    margin: "5px",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
};

export default SupplyChain;
