// File: SupplyChain.js

import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE"; // Replace securely

const SupplyChain = ({ currentUserRole = "farmer" }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualAddress, setManualAddress] = useState({});
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplyChainOrders"), (snapshot) => {
      const orderData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(orderData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await updateDoc(doc(db, "supplyChainOrders", orderId), {
      status: newStatus,
    });

    const trackingUrl = `https://your-app-domain.com/track
