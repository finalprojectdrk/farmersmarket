import React, { useEffect, useState } from "react";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = () => {
      const storedProducts = JSON.parse(localStorage.getItem("farmerProducts")) || [];
      setProducts(storedProducts);
    };

    fetchProducts();
    window.addEventListener("storage", fetchProducts);

    return () => window.removeEventListener("storage", fetchProducts);
  }, []);

  // 📝 Edit Product
  const handleEdit = (id) => {
    const updatedProducts = products.map((product) => {
      if (product.id === id) {
        const newName = prompt("Enter new crop name:", product.name);
        const newPrice = prompt("Enter new price (₹/kg):", product.price);
        const newQuantity = prompt("Enter new quantity (kg):", product.quantity);

        if (newName && newPrice && newQuantity) {
          return { ...product, name: newName, price: newPrice, quantity: newQuantity };
        }
      }
      return product;
    });

    setProducts(updatedProducts);
    localStorage.setItem("farmerProducts", JSON.stringify(updatedProducts));
  };

  // ❌ Delete Product
  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
      const filteredProducts = products.filter((product) => product.id !== id);
      setProducts(filteredProducts);
      localStorage.setItem("farmerProducts", JSON.stringify(filteredProducts));
    }
  };

  return (
    <div style={styles.container}>
      {products.length === 0 ? (
        <p>No products added yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Crop Name</th>
              <th>Price (₹/kg)</th>
              <th>Quantity (kg)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>₹ {product.price}</td>
                <td>{product.quantity} kg</td>
                <td>
                  <button style={styles.editBtn} onClick={() => handleEdit(product.id)}>✏️ Edit</button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(product.id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ✅ Inline CSS (No separate CSS file needed)
const styles = {
  container: {
    margin: "20px",
    padding: "15px",
    background: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  editBtn: {
    backgroundColor: "#ffc107",
    color: "black",
    border: "none",
    padding: "5px 10px",
    margin: "2px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "5px 10px",
    margin: "2px",
    cursor: "pointer",
    borderRadius: "5px",
  },
};

export default ProductList;
