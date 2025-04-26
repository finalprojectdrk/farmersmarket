import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Import db from your own firebase.js
import { collection, addDoc } from "firebase/firestore"; // Import these from firebase/firestore

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.price || !product.quantity) {
      alert("Please fill in all fields!");
      return;
    }

    setLoading(true);

    try {
      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        ...product,
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity),
        createdAt: new Date(),
      });

      alert("✅ Product added successfully!");
      navigate("/farmer-dashboard");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Add Product</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Crop Name"
          value={product.name}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="number"
          name="price"
          placeholder="Price per kg"
          value={product.price}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity (kg)"
          value={product.quantity}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

// ✅ Inline CSS Styles
const styles = {
  container: {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "30px",
    background: "#e6f9be",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  heading: {
    color: "#2e7d32", // Dark Green
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    background: "#ff9800", // Orange
    color: "white",
    padding: "12px",
    border: "none",
    borderRadius: "5px",
    fontSize: "18px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
};

export default AddProduct;
