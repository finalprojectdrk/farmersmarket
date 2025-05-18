// ...all existing imports
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

    const sinDLat = Math.sin(dLat / 2) ** 2;
    const sinDLon = Math.sin(dLon / 2) ** 2;
    const aCalc = sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
    return R * c;
  };

  const isValidMobile = (num) => {
    const cleaned = num.replace(/\s+/g, "");
    return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    const farmerName = farmerInfo?.name || "Unknown Farmer";
    const farmerPhone = farmerInfo?.phone || "N/A";

    try {
      const buyerContact = order.contact?.trim() || "";
      const buyerPhone = buyerContact.startsWith("+91") ? buyerContact : `+91${buyerContact}`;

      if (isValidMobile(buyerPhone)) {
        await sendSMS(
          buyerPhone,
          `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.\n👨‍🌾 Farmer: ${farmerName}, 📞 ${farmerPhone}`
        );
        console.log(`✅ SMS sent to buyer ${buyerPhone}`);
      } else {
        console.warn(`❌ Invalid buyer phone, skipped SMS: ${buyerPhone}`);
      }

      if (order.email) {
        await sendEmail(
          order.email,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status is now: ${newStatus}.\n\n👨‍🌾 Farmer: ${farmerName}\n📞 Contact: ${farmerPhone}\n\nThanks,\nFarmers Market`
        );
        console.log(`✅ Email sent to buyer ${order.email}`);
      }

      const farmersSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "farmer"))
      );

      for (const farmerDoc of farmersSnap.docs) {
        const farmer = farmerDoc.data();
        const rawPhone = farmer.phone?.trim() || "";
        const formattedPhone = rawPhone.startsWith("+91") ? rawPhone : `+91${rawPhone}`;

        if (isValidMobile(formattedPhone)) {
          await sendSMS(
            formattedPhone,
            `📢 Order (${order.orderId}) has been marked as ${newStatus} by ${farmerName}.`
          );
          console.log(`✅ SMS sent to farmer ${formattedPhone}`);
        } else {
          console.warn(`⚠️ Invalid farmer number, skipped: ${rawPhone}`);
        }
      }

      alert("✅ Status updated & notifications sent.");
    } catch (error) {
      console.error("❌ Notification error:", error);
      alert("❌ Failed to send some notifications. Check logs.");
    }
  };

  // ... other component functions like handleTrack, render, etc.

  return (
    <div>Supply Chain UI Placeholder</div>
  );
};

export default SupplyChain;
