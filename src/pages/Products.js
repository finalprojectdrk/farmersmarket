import React, { useState } from "react";
import { Link } from "react-router-dom";
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

  const categories = ["All", "Grains", "Vegetables", "Root Vegetables", "Pulses","Leafy Greens"];

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "All" || product.category === selectedCategory)
  );

  return (
    <div className="products-container">
      <h2>Available Products</h2>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search for crops..."
        className="search-box"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Category Filter Buttons */}
      <div className="category-buttons">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="product-list">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div className="product-card" key={product.id}>
              <img src={product.image} alt={product.name} className="product-image" />
              <h3>{product.name}</h3>
              <p>{product.price}</p>
              <Link to={`/product/${product.id}`} className="buy-button">
                Buy Now
              </Link>
            </div>
          ))
        ) : (
          <p className="no-results">No matching products found</p>
        )}
      </div>

      <Link to="/buyer-dashboard" className="back-button">
        Back to Dashboard
      </Link>
    </div>
  );
};

export default Products;