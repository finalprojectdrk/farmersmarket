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

const correctPhoneNumber = (number) => {
  if (!number) return "";
  const sanitized = number.toString().replace(/\D/g, "");
  if (sanitized.startsWith("91")) return `+${sanitized}`;
  if (sanitized.length === 10) return `+91${sanitized}`;
  return `+${sanitized}`;
};

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const [farmerList, setFarmerList] = useState([]);
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
    const fetchFarmers = async () => {
      const q = query(collection(db, "users"), where("role", "==", "farmer"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const farmers = querySnapshot.docs.map((doc) => doc.data());
        setFarmerList(farmers);
      }
    };
    fetchFarmers();
  }, []);

  const geocodeCoords = async (lat, lng) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    return data.results[0]?.formatted_address || `Lat: ${lat}, Lng: ${lng}`;
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      const buyerPhone = correctPhoneNumber(order.contact);

      for (const farmer of farmerList) {
        const farmerPhone = correctPhoneNumber(farmer.phone);
        await sendSMS(
          farmerPhone,
          `📦 Order (${order.orderId}) is now ${newStatus}. Please prepare accordingly.`
        );
        await sendEmail(
          farmer.email,
          "Order Status Updated",
          `Hi ${farmer.name},\n\nThe order (${order.orderId}) is now: ${newStatus}. Please prepare for further action.\n\nThanks,\nFarmers Market`
        );
      }

      await sendSMS(
        buyerPhone,
        `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.`
      );

      if (order.email) {
        await sendEmail(
          order.email,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) is now: ${newStatus}.\n\nThanks,\nFarmers Market`
        );
      }

      alert("✅ Status updated & notifications sent to all farmers.");
    } catch (error) {
      console.error("Notification error:", error);
      alert("⚠️ Status updated, but failed to send notifications.");
    }
  };

  return (
    <div>
      <h2>🚚 Supply Chain Tracking</h2>
    </div>
  );
};

export default SupplyChain;
