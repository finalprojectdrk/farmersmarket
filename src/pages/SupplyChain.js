import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../auth";
import { LoadScript } from "@react-google-maps/api";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const supplyChainRef = collection(db, "supplyChainOrders");
    const unsubscribe = onSnapshot(supplyChainRef, (snapshot) => {
      const orderList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
        };
      });
      setOrders(orderList);
    });

    return () => unsubscribe();
  }, [user]);

  const handleTrack = async (order) => {
    const destination = {
      lat: order.location.latitude,
      lng: order.location.longitude,
    };

    let origin;

    // If farmer address is provided, geocode it
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

    // Calculate distance using the geometry library
    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(origin),
      new window.google.maps.LatLng(destination)
    );

    if (distance > 2000) {
      alert("❌ Buyer too far for road travel.");
      return;
    }

    // Generate route between origin and destination
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", orderId);
    await updateDoc(orderRef, { status: newStatus });
    alert(`Order ${orderId} status updated to ${newStatus}.`);
  };

  return (
    <div>
      <h2>Supply Chain Dashboard</h2>
      {orders.length === 0 && <p>No orders found.</p>}
      {orders.map((order) => (
        <div key={order.id} className="order">
          <h3>{order.crop}</h3>
          <p>Buyer: {order.buyer}</p>
          <p>Status: {order.status}</p>
          <button onClick={() => handleTrack(order)}>Track Delivery</button>
          <button onClick={() => handleUpdateStatus(order.id, "Shipped")}>
            Mark as Shipped
          </button>
          <button onClick={() => handleUpdateStatus(order.id, "Delivered")}>
            Mark as Delivered
          </button>
        </div>
      ))}

      {directions && (
        <div>
          <h3>Route Directions</h3>
          <div id="directions-panel" />
        </div>
      )}
    </div>
  );
};

const SupplyChainWithMap = () => (
  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['geometry']}>
    <SupplyChain />
  </LoadScript>
);

export default SupplyChainWithMap;
