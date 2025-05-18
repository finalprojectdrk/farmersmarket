// Checkout.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { LoadScript } from "@react-google-maps/api";
import { db } from "../firebase";
import { useAuth } from "../auth";
import "./Checkout.css";
import { sendSMS } from "../utils/sms";
import { sendEmail } from "../utils/email";

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
          image: data.image || "",
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

  const sendNotification = async (orderId) => {
    try {
      const cleanedPhone = details.contact.startsWith("+91")
        ? details.contact
        : `+91${details.contact}`;

      // SMS to Buyer
      await sendSMS(
        cleanedPhone,
        `Hi ${details.name}, your order (${orderId}) has been placed! Farmer: Ravi - +91XXXXXXXXXX.`
      );

      // Email to Buyer
      if (user?.email) {
        await sendEmail(
          user.email,
          "Order Confirmation - Farmers Market",
          `Hi ${details.name},\n\nYour order (${orderId}) has been placed successfully!\n\nFarmer Contact:\nRavi - +91XXXXXXXXXX\n\nThank you,\nFarmers Market Team`
        );
      }

      // Notify Farmers
      const farmersQuery = query(collection(db, "users"), where("role", "==", "farmer"));
      const farmerSnapshot = await getDocs(farmersQuery);

      const notifyFarmers = farmerSnapshot.docs.map(async (docSnap) => {
        const farmer = docSnap.data();
        const farmerPhone = farmer.phone?.startsWith("+91")
          ? farmer.phone
          : `+91${farmer.phone}`;

        if (farmerPhone) {
          return sendSMS(
            farmerPhone,
            `📢 New Order ${orderId} placed by ${details.name}. Address: ${details.address}. Check dashboard for details.`
          );
        }
      });

      await Promise.all(notifyFarmers);
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
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
    const orderId = generateOrderId();

    try {
      await Promise.all(
        cart.map(async (item) => {
          await addDoc(collection(db, "supplyChainOrders"), {
            orderId,
            buyer: details.name,
            buyerId: user.uid,
            crop: item.name,
            location,
            address: details.address, // NEW: Human-readable address
            status: "Pending",
            transport: "Not Assigned",
            createdAt: new Date(),
            payment: details.payment,
            quantity: item.quantity,
            price: item.price,
            contact: details.contact,
            image: item.image || "",
          });

          await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
        })
      );

      await sendNotification(orderId);
      alert(`✅ Order placed!\nOrder ID: ${orderId}`);
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
              <img src={item.image} alt={item.name} width={40} height={40} style={{ marginRight: "10px" }} />
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
