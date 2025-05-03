import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const q = query(collection(db, "carts"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id, // Get Firestore doc ID
        ...doc.data(),
      }));
      setCartItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    try {
      const orderPromises = cartItems.map(async (item) => {
        if (!item.id) {
          console.warn("Item ID is missing for item:", item);
          return;
        }

        await addDoc(collection(db, "orders"), {
          ...item,
          userId: user.uid,
          status: "Pending",
          createdAt: new Date(),
        });

        // Remove from cart
        await deleteDoc(doc(db, "carts", item.id));
      });

      await Promise.all(orderPromises);

      alert("✅ Order placed successfully!");
      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("❌ Failed to place order.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="checkout-container">
      <h2>🛒 Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> — {item.price}
              </li>
            ))}
          </ul>
          <button onClick={handlePlaceOrder}>✅ Place Order</button>
        </>
      )}
    </div>
  );
};

export default Checkout;
