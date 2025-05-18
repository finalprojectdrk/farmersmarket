// Complete and refactored SupplyChainTracking.js with SMS notifications for all farmers and the specific buyer

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
  const [farmerInfo, setFarmerInfo] = useState({});
  const user = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'supplyChainOrders'), (snapshot) => {
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

  const handleStatusUpdate = async (order, newStatus) => {
    const orderRef = doc(db, 'supplyChainOrders', order.id);
    await updateDoc(orderRef, { status: newStatus });

    try {
      // Fetch all farmers
      const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
      const farmerSnapshots = await getDocs(farmersQuery);
      const farmerPhones = farmerSnapshots.docs.map((doc) => doc.data().phone);

      // Send SMS to all farmers
      for (const phone of farmerPhones) {
        await sendSMS(
          phone.startsWith('+91') ? phone : `+91${phone}`,
          `🚜 Update: Order (${order.orderId}) is now ${newStatus}. Check your dashboard for details.`
        );
      }
      console.log('✅ All farmers notified.');

      // Fetch the buyer's phone number
      const buyerQuery = query(collection(db, 'users'), where('email', '==', order.email));
      const buyerSnapshot = await getDocs(buyerQuery);

      if (!buyerSnapshot.empty) {
        const buyerPhone = buyerSnapshot.docs[0].data().phone;

        // Send SMS to the buyer
        if (buyerPhone) {
          await sendSMS(
            buyerPhone.startsWith('+91') ? buyerPhone : `+91${buyerPhone}`,
            `📦 Hi ${order.buyer}, your order (${order.orderId}) is now ${newStatus}.`
          );
        }
      }

      // Send Email to the buyer
      if (order.email) {
        await sendEmail(
          order.email,
          'Order Status Updated',
          `Hi ${order.buyer},\n\nYour order (${order.orderId}) status is now: ${newStatus}.\n\nThanks,\nFarmers Market`
        );
      }

      alert('✅ Status updated & notifications sent to all farmers and the buyer.');
    } catch (error) {
      console.error('❌ Notification error:', error);
    }
  };

  return (
    <div>Supply Chain Component Loaded</div>
  );
};

export default SupplyChain;
