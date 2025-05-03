import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { LoadScript } from "@react-google-maps/api";
import { db } from "../firebase";
import { useAuth } from "../auth";
import "./Checkout.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const generateOrderId = () => {
  return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const CheckoutForm = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    name: "",
    address: "",
    contact: "",
    payment: "COD",
  });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    const cartRef = collection(db, "carts", user.uid, "items");
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "Unnamed",
          price: data.price || 0,
          quantity: data.quantity || 1,
        };
      });
      setCart(items);
    });

    return () => unsubscribe();
  }, [user]);

  const getCoordinatesFromAddress = async (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          resolve({
            latitude: results[0].geometry.location.lat(),
            longitude: results[0].geometry.location.lng(),
          });
        } else {
          reject("Geocoding failed: " + status);
        }
      });
    });
  };

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleLocation = async () => {
    if (!details.address) return alert("Please enter an address first.");
    try {
      const coords = await getCoordinatesFromAddress(details.address);
      setLocation(coords);
      alert("📍 Location set!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to get location");
    }
  };

  const sendNotification = (orderId) => {
    console.log(`📩 Sending confirmation email & SMS for Order ID: ${orderId}`);
    // Integrate with backend or external APIs like Twilio/SendGrid here
  };

  const handleOrderConfirm = async () => {
    if (!details.name || !details.address || !details.contact) {
      return alert("Please fill all fields.");
    }
    if (!location.latitude) {
      return alert("Please fetch location.");
    }
    if (cart.length === 0) {
      return alert("Cart is empty!");
    }
    if (!user?.uid) {
      return alert("User not logged in.");
    }

    setLoading(true);
    try {
      const orderIds = [];

      await Promise.all(
        cart.map(async (item) => {
          const orderId = generateOrderId();
          orderIds.push(orderId);

          await addDoc(collection(db, "supplyChainOrders"), {
            orderId,
            buyer: details.name,
            buyerId: user.uid,
            crop: item.name,
            location,
            status: "Pending",
            transport: "Not Assigned",
            createdAt: new Date(),
            payment: details.payment,
            quantity: item.quantity || 1,
            price: item.price,
            contact: details.contact,
          });

          await deleteDoc(doc(db, "carts", user.uid, "items", item.id));

          sendNotification(orderId);
        })
      );

      alert(`✅ Orders placed!\nYour Order IDs:\n${orderIds.join("\n")}`);
      navigate("/products");
    } catch (e) {
      console.error(e);
      alert("❌ Order failed");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    const itemRef = doc(db, "carts", user.uid, "items", itemId);
    await updateDoc(itemRef, { quantity: newQty });
  };

  return (
    <div className="checkout-container">
      <h2>🧾 Checkout</h2>
      <input name="name" placeholder="Name" onChange={handleChange} value={details.name} />
      <input name="address" placeholder="Delivery Address" onChange={handleChange} value={details.address} />
      <input name="contact" placeholder="Contact" onChange={handleChange} value={details.contact} />
      <select name="payment" onChange={handleChange} value={details.payment}>
        <option value="COD">Cash on Delivery</option>
        <option value="UPI">UPI</option>
      </select>
      <button onClick={handleLocation}>📍 Get Location</button>
      <button onClick={handleOrderConfirm} disabled={loading}>
        {loading ? "Placing..." : "Confirm Order"}
      </button>

      <div className="cart-summary">
        <h3>Cart Summary</h3>
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              {item.name} - ₹{item.price} x {item.quantity}{" "}
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Checkout = () => (
  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
    <CheckoutForm />
  </LoadScript>
);

export default Checkout;
