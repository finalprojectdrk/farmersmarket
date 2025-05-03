import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth"; // Custom hook for current user
import "./Products.css";

const products = [
  { id: 0, name: "Tomatoes", price: "₹30/kg", image: "/img/tomatoes.jpg", category: "Vegetables" },
  { id: 1, name: "Potatoes", price: "₹20/kg", image: "/img/potatoes.jpg", category: "Vegetables" },
  { id: 2, name: "Wheat", price: "₹40/kg", image: "/img/wheat.jpg", category: "Grains" },
  { id: 3, name: "Onion", price: "₹100/kg", image: "/img/onion.jpg", category: "Vegetables" },
  { id: 4, name: "Lady's Finger", price: "₹50/kg", image: "/img/ladysfinger.jpg", category: "Vegetables" },
  { id: 5, name: "Cabbage", price: "₹70/kg", image: "/img/cabbage.jpg", category: "Vegetables" },
  { id: 6, name: "Drumstick", price: "₹60/kg", image: "/img/drumstick.jpg", category: "Vegetables" },
  { id: 7, name: "Brinjal", price: "₹50/kg", image: "/img/brinjal.jpg", category: "Vegetables" },
  { id: 8, name: "Radish", price: "₹40/kg", image: "/img/radish.jpg", category: "Vegetables" },
  { id: 9, name: "Beetroot", price: "₹100/kg", image: "/img/beetroot.jpg", category: "Vegetables" },
  { id: 10, name: "Kohlrabi", price: "₹50/kg", image: "/img/kohlrabi.jpg", category: "Vegetables" },
  { id: 11, name: "Ridge gourd", price: "₹70/kg", image: "/img/ridgegourd.jpg", category: "Vegetables" },
  { id: 12, name: "Capsicum", price: "₹20/kg", image: "/img/capsicum.jpg", category: "Vegetables" },
  { id: 13, name: "Taro root", price: "₹70/kg", image: "/img/taroroot.jpg", category: "Root Vegetables" },
  { id: 14, name: "Elephant yam", price: "₹60/kg", image: "/img/elephantyam.jpg", category: "Root Vegetables" },
  { id: 15, name: "Beans", price: "₹50/kg", image: "/img/beans.jpg", category: "Vegetables" },
  { id: 16, name: "Flat beans", price: "₹40/kg", image: "/img/flatbeans.jpg", category: "Vegetables" },
  { id: 17, name: "Carrot", price: "₹30/kg", image: "/img/carrot.jpg", category: "Root Vegetables" },
  { id: 18, name: "Cluster beans", price: "₹60/kg", image: "/img/clusterbeans.jpg", category: "Vegetables" },
  { id: 19, name: "Agathi keerai", price: "₹210/kg", image: "/img/agathikeerai.jpg", category: "Leafy Greens" },
  { id: 20, name: "Sessile joyweed", price: "₹240/kg", image: "/img/sessilejoyweed.jpg", category: "Leafy Greens" },
  { id: 21, name: "Thandu keerai", price: "₹180/kg", image: "/img/thandukeerai.jpg", category: "Leafy Greens" },
  { id: 22, name: "Ponnanganni keerai", price: "₹150/kg", image: "/img/ponnangannikeerai.jpg", category: "Leafy Greens" },
  { id: 23, name: "Toor dal", price: "₹160/kg", image: "/img/toordal.jpg", category: "Pulses" },
  { id: 24, name: "Chana dal", price: "₹140/kg", image: "/img/chanadal.jpg", category: "Pulses" },
  { id: 25, name: "Urad dal", price: "₹140/kg", image: "/img/uraddal.jpg", category: "Pulses" },
  { id: 26, name: "Moong dal", price: "₹180/kg", image: "/img/moongdal.jpg", category: "Pulses" },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const user = useAuth();
  const navigate = useNavigate();

  const categories = ["All", "Grains", "Vegetables", "Root Vegetables", "Pulses", "Leafy Greens"];

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || product.category === selectedCategory)
  );

  const addToCart = async (product) => {
    if (!user) return alert("Login required.");

    try {
      const docRef = await addDoc(collection(db, "carts"), {
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image,
        userId: user.uid,
        addedAt: new Date(),
      });

      // ✅ Update item to include the generated ID
      await updateDoc(doc(db, "carts", docRef.id), {
        id: docRef.id,
      });

      alert("✅ Added to cart!");
    } catch (err) {
      console.error("Failed to add to cart:", err);
      alert("❌ Failed to add.");
    }
  };

  const goToCart = () => {
    if (!user) return alert("Login required.");
    navigate("/checkout");
  };

  return (
    <div className="products-container">
      <h2>Available Products</h2>

      <div className="top-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-box"
        />
        <button onClick={goToCart} className="go-to-cart-button">
          🛒 Go to Cart
        </button>
      </div>

      <div className="category-buttons">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="product-list">
        {filteredProducts.map((product) => (
          <div className="product-card" key={product.id}>
            <img src={product.image} alt={product.name} className="product-image" />
            <h3>{product.name}</h3>
            <p>{product.price}</p>
            <button className="buy-button" onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
