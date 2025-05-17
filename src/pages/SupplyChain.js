
// src/pages/SupplyChain.js

import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import emailjs from "emailjs-com";
import { sendSMS } from "../utils/sms";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 10.7905,
  lng: 78.7047,
};

const getAddressFromCoordinates = async (lat, lng) => {
  const apiKey = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your real key
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );
  const data = await response.json();
  if (data.status === "OK" && data.results.length > 0) {
    return data.results[0].formatted_address;
  } else {
    throw new Error("Unable to fetch address");
  }
};

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);

  const fetchOrders = async () => {
    const q = query(collection(db, "orders"));
    const querySnapshot = await getDocs(q);
    const ordersData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrders(ordersData);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus, phone, email) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
    });
    fetchOrders();
    sendSMS(phone, `Your order ${orderId} status changed to: ${newStatus}`);
    emailjs.send(
      "service_id",
      "template_id",
      {
        to_email: email,
        message: `Your order ${orderId} is now: ${newStatus}`,
      },
      "user_id"
    );
  };

  const handleDelete = async (orderId) => {
    await deleteDoc(doc(db, "orders", orderId));
    fetchOrders();
  };

  const trackOrder = async (origin, destination) => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("Error fetching directions", result);
        }
      }
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Supply Chain</h2>
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white shadow-md rounded p-4 mb-4 space-y-2"
        >
          <img
            src={order.imageURL}
            alt={order.name}
            className="w-32 h-32 object-cover rounded"
          />
          <p>
            <strong>{order.name}</strong> - Qty: {order.quantity}
          </p>
          <p>Status: {order.status}</p>
          <p>Buyer: {order.buyerName}</p>
          <p>Email: {order.email}</p>
        </div>
      ))}
      <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={7}>
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default SupplyChain;
