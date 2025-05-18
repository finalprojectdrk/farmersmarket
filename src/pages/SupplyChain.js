import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { sendSMS } from "../utils/sms";
import GoogleMapReact from "google-map-react";
import { Button } from "@/components/ui/button";
import "./SupplyChain.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";
const Marker = ({ text }) => <div className="marker">📍 {text}</div>;

const SupplyChain = () => {
  const user = useAuth();
  const [orders, setOrders] = useState([]);
  const [mapData, setMapData] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "supplyChainOrders"), where("status", "!=", "Delivered"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (order, newStatus) => {
    try {
      const orderRef = doc(db, "supplyChainOrders", order.id);
      await updateDoc(orderRef, { status: newStatus });

      const cleanedPhone = order.contact?.startsWith("+91") ? order.contact : `+91${order.contact}`;

      if (cleanedPhone) {
        await sendSMS(
          cleanedPhone,
          `📦 Your order (${order.orderId}) status has been updated to '${newStatus}'.`
        );
      }

      alert("✅ Status updated & SMS sent!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update status or send SMS.");
    }
  };

  const handleTrack = (order) => {
    setMapData({
      center: {
        lat: order.location.latitude,
        lng: order.location.longitude,
      },
      zoom: 10,
      orderId: order.orderId,
    });
  };

  return (
    <div className="supplychain-container">
      <h2>🚚 Supply Chain Management</h2>
      <div className="order-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <img src={order.image} alt={order.crop} className="order-image" />
            <h4>{order.crop}</h4>
            <p>Buyer: {order.buyer}</p>
            <p>Contact: {order.contact}</p>
            <p>Status: {order.status}</p>
            <Button onClick={() => updateStatus(order, "In Transit")}>In Transit</Button>
            <Button onClick={() => updateStatus(order, "Delivered")}>Delivered</Button>
            <Button onClick={() => handleTrack(order)}>📍 Track</Button>
          </div>
        ))}
      </div>

      {mapData.center && (
        <div className="map-container">
          <h3>Tracking Order: {mapData.orderId}</h3>
          <div style={{ height: "400px", width: "100%" }}>
            <GoogleMapReact
              bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
              defaultCenter={mapData.center}
              defaultZoom={mapData.zoom}
            >
              <Marker
                lat={mapData.center.lat}
                lng={mapData.center.lng}
                text="Buyer"
              />
            </GoogleMapReact>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChain;
