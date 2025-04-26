import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, addDoc, collection } from "../firebase"; // Import Firestore methods

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    status: "Pending", // Default status for new products
    transport: "", // Transport details for supply chain
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.price || !product.quantity || !product.transport) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Get the reference to the 'products' collection
      const productsRef = collection(db, "products");

      // Add the new product to the Firestore database
      await addDoc(productsRef, {
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        status: product.status,
        transport: product.transport,
        createdAt: new Date(),
      });

      alert("Product added successfully!");
      navigate("/farmer-dashboard"); // Redirect to dashboard
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("Error adding product. Please try again.");
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
        <input
          type="text"
          name="transport"
          placeholder="Transport Details (e.g., Truck - TN 45 AB 6789)"
          value={product.transport}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Add Product</button>
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
