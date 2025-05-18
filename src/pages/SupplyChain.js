""// Enhanced SupplyChainTracking.js with full UI, map, and notification logic

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api';
import { sendSMS } from '../utils/sms';
import { sendEmail } from '../utils/email';
import { useAuth } from '../auth';
import './SupplyChain.css';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [farmerInfo, setFarmerInfo] = useState({});
  const user = useAuth();

  // Fetch Orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'supplyChainOrders'), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((order) => !order.farmerDeleted);
      setOrders(data);
    });
    return () => unsub();
  }, []);

  // Fetch Farmer Info
  useEffect(() => {
    const fetchFarmer = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'farmer'),
        where('email', '==', user?.email)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0].data();
        setFarmerInfo(doc);
      }
    };
    if (user?.email) fetchFarmer();
  }, [user]);

  // Handle Status Update
  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, 'supplyChainOrders', order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
      const farmerSnapshots = await getDocs(farmersQuery);
      const farmerPhones = farmerSnapshots.docs.map((doc) => doc.data().phone);

      for (const phone of farmerPhones) {
        await sendSMS(
          phone.startsWith('+91') ? phone : `+91${phone}`,
          `🚜 Update: Order (${order.orderId}) is now ${newStatus}. Check your dashboard for details.`
        );
      }
      console.log('✅ All farmers notified.');

      const buyerQuery = query(collection(db, 'users'), where('email', '==', order.email));
      const buyerSnapshot = await getDocs(buyerQuery);

      if (!buyerSnapshot.empty) {
        const buyerPhone = buyerSnapshot.docs[0].data().phone;
        if (buyerPhone) {
          await sendSMS(
            buyerPhone.startsWith('+91') ? buyerPhone : `+91${buyerPhone}`,
            `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.`
          );
        }
      }

      if (order.email) {
        await sendEmail(
          order.email,
          'Order Status Updated',
          `Hi ${order.buyer},

Your order (${order.orderId}) status is now: ${newStatus}.

Thanks,
Farmers Market`
        );
      }

      alert('✅ Status updated & notifications sent.');
    } catch (error) {
      console.error('❌ Notification error:', error);
    }
  };

  // Render Component
  return (
    <div className="supplychain-container">
      <h2>🚚 Supply Chain Tracking</h2>
      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>Order ID: {order.orderId}</h3>
              <p><strong>Crop:</strong> {order.crop}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Buyer:</strong> {order.buyer}</p>
              <p><strong>Contact:</strong> {order.contact}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <button onClick={() => handleStatusUpdate(order, 'Shipped')}>📦 Shipped</button>
              <button onClick={() => handleStatusUpdate(order, 'In Transit')}>🚚 In Transit</button>
              <button onClick={() => handleStatusUpdate(order, 'Delivered')}>✅ Delivered</button>
            </div>
          ))
        ) : (
          <p>No Orders Found</p>
        )}
      </div>
      {directions && (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '400px' }}
            center={directions.routes[0].overview_path[0]}
            zoom={10}
          >
            <DirectionsRenderer directions={directions} />
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

export default SupplyChain;
""
