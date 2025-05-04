import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../auth";
import "./Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const user = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsList);
    };

    fetchProducts();
  }, []);

  const addToCart = async (product) => {
    if (!user?.uid) {
      return alert("Please log in to add to cart.");
    }

    try {
      const itemRef = doc(db, "carts", user.uid, "items", product.id);
      await setDoc(itemRef, {
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image || "", // ✅ include image path here
      });
      alert("✅ Added to cart");
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("❌ Failed to add to cart");
    }
  };

  return (
    <div className="products-container">
      <h2>🌾 Available Crops</h2>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img
              src={product.image || "https://via.placeholder.com/150"}
              alt={product.name}
              className="product-img"
            />
            <h3>{product.name}</h3>
            <p>Price: ₹{product.price}</p>
            <button onClick={() => addToCart(product)}>🛒 Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
