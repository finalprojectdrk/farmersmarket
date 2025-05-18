// SupplyChain.js - Updated to send SMS to all farmers upon status change

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

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
const LIBRARIES = ["places"];

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

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, "supplyChainOrders", order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      const phone = order.contact.startsWith("+91") ? order.contact : `+91${order.contact}`;

      // Notify Buyer
      await sendSMS(
        phone,
        `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.`
      );

      if (order.email) {
        await sendEmail(
          order.email,
          "Order Status Updated",
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) is now: ${newStatus}.\n\nThanks,\nFarmers Market`
        );
      }

      // Notify All Farmers
      const farmersQuery = query(collection(db, "users"), where("role", "==", "farmer"));
      const farmerSnapshots = await getDocs(farmersQuery);

      for (const farmerDoc of farmerSnapshots.docs) {
        const farmerData = farmerDoc.data();
        const farmerPhone = farmerData.phone.startsWith("+91") ? farmerData.phone : `+91${farmerData.phone}`;

        await sendSMS(
          farmerPhone,
          `🚜 Update: Order (${order.orderId}) is now ${newStatus}. Check your dashboard for details.`
        );
      }
      console.log("✅ All farmers notified.");
      alert("✅ Status updated & notifications sent to all farmers and the buyer.");

    } catch (error) {
      console.error("Notification error:", error);
      alert("⚠️ Status updated, but failed to send notifications.");
    }
  };
  
  return <div>Supply Chain Component Loaded</div>;
};

export default SupplyChain;
