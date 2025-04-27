import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./FarmerDashboard.css";

const FarmerDashboard = () => {
  const [cropPrices, setCropPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [allCropPrices, setAllCropPrices] = useState([]);
  const [filter, setFilter] = useState("");
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [predictionData, setPredictionData] = useState(null); // <-- NEW for predictions
  const [selectedCrop, setSelectedCrop] = useState(""); // <-- NEW for selecting crop

  const recordsPerPage = 10;
  const productsPerPage = 5;

  // Fetch Crop Prices
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        const url =
          "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }
        const data = await response.json();
        const records = data.records.map((record) => ({
          crop: record.commodity,
          price: (parseFloat(record.modal_price) / 100).toFixed(2),
          market: record.market,
          date: new Date().toLocaleString(),
        }));

        setAllCropPrices(records);
        setTotalPages(Math.ceil(records.length / recordsPerPage));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();
  }, []);

  // Fetch Farmer's Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, "products"), where("farmerEmail", "==", user.email));
        const querySnapshot = await getDocs(q);

        const fetchedProducts = [];
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() });
        });

        setProducts(fetchedProducts);
        setProductTotalPages(Math.ceil(fetchedProducts.length / productsPerPage));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Update DateTime
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "products", productId));
        setProducts(products.filter((product) => product.id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const filteredData = allCropPrices.filter(
    (priceData) =>
      priceData.crop.toLowerCase().includes(filter.toLowerCase()) ||
      priceData.market.toLowerCase().includes(filter.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const currentProductData = products.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleProductNextPage = () => {
    if (productPage < productTotalPages) setProductPage((prev) => prev + 1);
  };

  const handleProductPrevPage = () => {
    if (productPage > 1) setProductPage((prev) => prev - 1);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePredictPrices = async () => {
    if (!selectedCrop) {
      alert("Please select a crop to predict!");
      return;
    }

    try {
      const response = await fetch(`https://crop-predictor-backend.onrender.com/predict?crop=${selectedCrop}`);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setPredictionData(data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      alert("Failed to fetch prediction.");
    }
  };

  if (loading) return <div>Loading real-time crop prices...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="current-datetime">
        <h4>Current Date & Time: {currentDateTime}</h4>
      </div>

      <div className="filter-section">
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Search by crop or market..."
        />
      </div>

      {/* 🆕 Select Crop for Prediction */}
      <div className="prediction-section card">
        <h3>📈 Predict Future Crop Prices</h3>
        <input
          type="text"
          placeholder="Enter crop name (e.g., Wheat)"
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
        />
        <button onClick={handlePredictPrices} style={styles.predictButton}>
          Predict Prices
        </button>

        {/* 🆕 Show Prediction Results */}
        {predictionData && (
          <div className="prediction-results">
            <h4>Prediction for {predictionData.crop} (next 7 days)</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Predicted Price (₹/kg)</th>
                </tr>
              </thead>
              <tbody>
                {predictionData.dates.map((date, index) => (
                  <tr key={index}>
                    <td>{date}</td>
                    <td>₹ {predictionData.prices[index].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="price-section card">
        <h3>🌾 Real-Time Crop Prices</h3>
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Market Price (₹/kg)</th>
              <th>Market</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((priceData, index) => (
              <tr key={index}>
                <td>{priceData.crop}</td>
                <td>₹ {priceData.price}</td>
                <td>{priceData.market}</td>
                <td>{priceData.date}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} of {Math.ceil(filteredData.length / recordsPerPage)}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === Math.ceil(filteredData.length / recordsPerPage)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Farmer's Products */}
      <div className="products-section card">
        <h3>📦 Your Listed Products</h3>
        {products.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Product Name</th>
                  <th style={styles.th}>Price (₹)</th>
                  <th style={styles.th}>Quantity (kg)</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProductData.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>{product.productName}</td>
                    <td style={styles.td}>₹ {product.price}</td>
                    <td style={styles.td}>{product.quantity}</td>
                    <td style={styles.td}>
                      <button style={styles.editButton} onClick={() => alert("Edit feature coming soon!")}>
                        Edit
                      </button>
                      <button style={styles.deleteButton} onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No products listed yet!</p>
        )}

        {products.length > productsPerPage && (
          <div className="pagination">
            <button onClick={handleProductPrevPage} disabled={productPage === 1}>
              Previous
            </button>
            <span>
              Page {productPage} of {productTotalPages}
            </span>
            <button
              onClick={handleProductNextPage}
              disabled={productPage === productTotalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  tableContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  table: {
    borderCollapse: "collapse",
    width: "90%",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "12px",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
  },
  editButton: {
    marginRight: "10px",
    padding: "6px 12px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "6px 12px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  predictButton: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#ff9800",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  }
};

export default FarmerDashboard;
