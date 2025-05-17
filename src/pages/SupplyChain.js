
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

import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const SupplyChain = ({ currentUserRole = "farmer" }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualAddress, setManualAddress] = useState({});
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "supplyChainOrders"),
      (snapshot) => {
        const orderData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(orderData);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      await updateDoc(doc(db, "supplyChainOrders", orderId), {
        status: newStatus,
      });

      const trackingUrl = `https://farmerssmarket.com/track?id=${orderId}`;

      if (order.buyerEmail) {
        try {
          await sendEmail(
            order.buyerEmail,
            `Order ${newStatus}`,
            `Hi ${order.buyer || "Customer"}, your crop order (${order.crop || "Crop"}) is now "${newStatus}".
Track your order here: ${trackingUrl}`
          );
        } catch (emailErr) {
          console.error("Email error:", emailErr);
        }
      } else {
        console.warn(`Missing buyerEmail for order ${orderId}`);
      }

      if (order.buyerPhone) {
        try {
          const cleanedPhone = order.buyerPhone.startsWith("+91")
            ? order.buyerPhone
            : `+91${order.buyerPhone}`;

          await sendSMS(
            cleanedPhone,
            `Order (${order.crop || "Crop"}) is "${newStatus}". Track: ${trackingUrl}`
          );
        } catch (smsErr) {
          console.error("SMS error:", smsErr);
        }
      } else {
        console.warn(`Missing buyerPhone for order ${orderId}`);
      }
    } catch (err) {
      console.error(`Failed to update order status for ${orderId}:`, err);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Delete this delivered order?")) {
      await deleteDoc(doc(db, "supplyChainOrders", orderId));
    }
  };

  const autoDetectAndSave = async (orderId) => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const address = await getAddressFromCoordinates(
          coords.latitude,
          coords.longitude
        );
        if (address) {
          await updateDoc(doc(db, "supplyChainOrders", orderId), {
            originAddress: address,
            originLocation: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          });
          alert("Auto location saved!");
        } else {
          alert("Could not detect address.");
        }
      },
      (err) => {
        alert("Location error.");
        console.error(err);
      }
    );
  };

  const saveManualLocation = async (orderId) => {
    const address = manualAddress[orderId];
    if (!address) return alert("Enter address.");
    // Add geocoding logic and update Firestore
  };

  return <div>SupplyChain Page</div>;
};

export default SupplyChain;
