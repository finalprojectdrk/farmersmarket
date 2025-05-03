import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

const Checkout = () => {
  const user = useAuth();
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    name: "",
    address: "",
    contact: "",
    payment: "Cash on Delivery",
  });
  const [cart, setCart] = useState([]);
  const [location, setLocation] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch user's cart items from Firestore
  React.useEffect(() => {
    if (user?.uid) {
      const fetchCart = async () => {
        const querySnapshot = await getDocs(collection(db, "carts", user.uid, "items"));
        const cartItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCart(cartItems);
      };
      fetchCart();
    }
  }, [user]);

  // Get geolocation
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported");
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        alert("📍 Location fetched successfully!");
      },
      () => alert("❌ Failed to fetch location")
    );
  };

  const handleOrderConfirm = async () => {
    if (!details.name || !details.address || !details.contact) {
      return alert("Please fill all fields");
    }

    if (!location.latitude) {
      return alert("Please fetch location");
    }

    if (cart.length === 0) {
      return alert("Cart is empty!");
    }

    console.log("Placing order for user:", user?.uid);
    setLoading(true);

    try {
      const successfulOrders = [];

      for (const item of cart) {
        const { name, price, quantity, id } = item;

        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);

        if (!name || isNaN(numericPrice) || isNaN(numericQuantity)) {
          console.warn("Skipping invalid item:", item);
          continue;
        }

        console.log("Order price:", numericPrice);

        // Add to Firestore
        await addDoc(collection(db, "supplyChainOrders"), {
          buyer: details.name,
          buyerId: user?.uid,
          crop: name,
          quantity: numericQuantity,
          price: numericPrice,
          payment: details.payment,
          status: "Pending",
          transport: "Not Assigned",
          location,
          createdAt: new Date(),
        });

        // Delete cart item
        if (id) {
          const cartItemRef = doc(db, "carts", user.uid, "items", id);
          await deleteDoc(cartItemRef);
        }

        successfulOrders.push(name);
      }

      if (successfulOrders.length > 0) {
        alert("✅ Orders placed!");
        navigate("/products");
      } else {
        alert("❌ No valid items to place order");
      }
    } catch (e) {
      console.error("Order placement error:", e);
      alert("❌ Order failed");
    }

    setLoading(false);
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      <div className="checkout-form">
        <input
          type="text"
          placeholder="Name"
          value={details.name}
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Address"
          value={details.address}
          onChange={(e) => setDetails({ ...details, address: e.target.value })}
        />
        <input
          type="text"
          placeholder="Contact"
          value={details.contact}
          onChange={(e) => setDetails({ ...details, contact: e.target.value })}
        />
        <select
          value={details.payment}
          onChange={(e) => setDetails({ ...details, payment: e.target.value })}
        >
          <option>Cash on Delivery</option>
          <option>UPI</option>
          <option>Card</option>
        </select>
        <button onClick={fetchLocation}>📍 Fetch Location</button>
        <button onClick={handleOrderConfirm} disabled={loading}>
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
