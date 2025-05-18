import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleMap, DirectionsRenderer, useLoadScript } from '@react-google-maps/api';
import sendSMS from '../utils/sendSMS';
import sendEmail from '../utils/sendEmail';

const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
  marginTop: '1rem'
};

const containerStyle = {
  padding: '1rem',
  fontFamily: 'Arial, sans-serif'
};

const cardStyle = {
  background: '#fff',
  padding: '1rem',
  borderRadius: '12px',
  margin: '1rem 0',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)'
};

const imageStyle = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  borderRadius: '8px'
};

export default function SupplyChain() {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";
    libraries
  });

  useEffect(() => {
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    };

    fetchOrders();
  }, []);

  const handleTrack = async (orderId, origin, destination) => {
    if (!isLoaded || !origin || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(prev => ({ ...prev, [orderId]: result }));
        } else {
          alert('Directions request failed due to ' + status);
        }
      }
    );
  };

  const handleStatusChange = async (orderId, status, buyerPhone, buyerEmail) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });

    const message = `Order ${orderId} status updated to "${status}".`;
    if (buyerPhone) await sendSMS(buyerPhone, message);
    if (buyerEmail) await sendEmail(buyerEmail, 'Order Update', message);
    alert('Status updated and notification sent!');
  };

  return (
    <div style={containerStyle}>
      <h2>Supply Chain Tracking</h2>
      {orders.map(order => (
        <div key={order.id} style={cardStyle}>
          <h3>Order ID: {order.id}</h3>
          <p><strong>Product:</strong> {order.productName}</p>
          <p><strong>Buyer:</strong> {order.buyerName}</p>
          <p><strong>Status:</strong> {order.status}</p>
          {order.imageUrl && <img src={order.imageUrl} alt="product" style={imageStyle} />}
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => handleTrack(order.id, order.farmerLocation, order.buyerLocation)}>
              Track
            </button>
            <select
              value={order.status}
              onChange={e => handleStatusChange(order.id, e.target.value, order.buyerPhone, order.buyerEmail)}
              style={{ marginLeft: '10px' }}
            >
              <option value="Ordered">Ordered</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {directions[order.id] && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={7}
              center={directions[order.id].routes[0].bounds.getCenter()}
            >
              <DirectionsRenderer directions={directions[order.id]} />
            </GoogleMap>
          )}
        </div>
      ))}
    </div>
  );
}
