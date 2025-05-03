import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, deleteDoc, doc, addDoc } from "firebase/firestore";
import { LoadScript } from "@react-google-maps/api";
import { db } from "../firebase";
import { useAuth } from "../auth"; // Custom hook for current user
import "./Checkout.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo";

const Checkout = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({ name: "", address: "", contact: "", payment: "COD" });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useAuth();

  // Fetch cart items from Firestore
  useEffect(() => {
    if (!user) return;

    const cartRef = collection(db, "carts", user.uid, "items");
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCart(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Get coordinates from the entered address using Google Maps API
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

  // Handle changes to form fields
  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  // Handle location setting from the address input
  const handleLocation = async () => {
    if (!details.address) return alert("Enter address first");
    try {
      const coords = await getCoordinatesFromAddress(details.address);
      setLocation(coords);
      alert("📍 Location set!");
    } catch (err) {
      alert("❌ Failed to get location");
    }
  };

  // Confirm and place the order
  const handleOrderConfirm = async () => {
    if (!details.name || !details.address || !details.contact) return alert("Please fill all fields");
    if (!location.latitude) return alert("Please fetch location");
    if (cart.length === 0) return alert("Cart is empty!");

    setLoading(true);

    try {
      await Promise.all(
        cart.map(async (item) => {
          await addDoc(collection(db, "supplyChainOrders"), {
            buyer: details.name,
            buyerId: user.uid, // Store UID for buyer
            crop: item.name,
            farmer: item.farmer,
            location,
            status: "Pending", // Order initially in "Pending" state
            transport: "Not Assigned",
            createdAt: new Date(),
          });

          // Delete item from the cart after placing the order
          await deleteDoc(doc(db, "carts", user.uid, "items", item.id));
        })
      );
      alert("✅ Orders placed!");
      navigate("/products"); // Redirect after order placement
    } catch (e) {
      console.error(e);
      alert("❌ Order failed");
    }

    setLoading(false);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="checkout-container">
        <h2>🧾 Checkout</h2>
        <input
          name="name"
          placeholder="Name"
          value={details.name}
          onChange={handleChange}
          required
        />
        <input
          name="address"
          placeholder="Delivery Address"
          value={details.address}
          onChange={handleChange}
          required
        />
        <input
          name="contact"
          placeholder="Contact"
          value={details.contact}
          onChange={handleChange}
          required
        />
        <select name="payment" value={details.payment} onChange={handleChange}>
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
                {item.name} - ₹{item.price} x {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LoadScript>
  );
};

export default Checkout;
