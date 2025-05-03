import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import "./FarmerDashboard.css";

// Register necessary chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [predictionData, setPredictionData] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  const recordsPerPage = 10;
  const productsPerPage = 5;

  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        const url =
          "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch crop prices");
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(products.filter((product) => product.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handlePredictPrices = async () => {
    if (!selectedCrop.trim()) {
      alert("Please enter a crop name for prediction.");
      return;
    }

    try {
      setPredictionLoading(true);
      setPredictionError(null);
      setPredictionData(null);

      const response = await fetch(`https://predictprice.onrender.com/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ crop: selectedCrop.trim() })
      });

      const data = await response.json();
      if (data.error) {
        setPredictionError(data.error);
        return;
      }

      const today = new Date();
      const next7Dates = Array.from({ length: 7 }, (_, i) =>
        new Date(today.getTime() + i * 86400000).toLocaleDateString()
      );

      setPredictionData({
        crop: selectedCrop.trim(),
        prices: data.predicted_prices,
        dates: next7Dates,
      });
    } catch (error) {
      console.error("Prediction error:", error);
      setPredictionError("Failed to fetch prediction.");
    } finally {
      setPredictionLoading(false);
    }
  };

  // Prepare data for the chart (predicted prices)
  const chartData = {
    labels: predictionData ? predictionData.dates : [],
    datasets: [
      {
        label: `Predicted Price for ${selectedCrop}`,
        data: predictionData ? predictionData.prices.map((price) => price.toFixed(2)) : [],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const filteredData = allCropPrices.filter(
    (p) =>
      p.crop.toLowerCase().includes(filter.toLowerCase()) ||
      p.market.toLowerCase().includes(filter.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const currentProductData = products.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );

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
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by crop or market..."
        />
      </div>

      <div className="prediction-section card">
        <h3>📈 Predict Future Crop Prices</h3>
        <input
          type="text"
          placeholder="Enter crop name (e.g., Wheat)"
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
        />
        <button onClick={handlePredictPrices} style={styles.predictButton} disabled={predictionLoading}>
          {predictionLoading ? "Predicting..." : "Predict Prices"}
        </button>

        {predictionError && <div className="error">{predictionError}</div>}

        {predictionData && (
          <div className="prediction-results">
            <h4>Prediction for {predictionData.crop} (Next 7 Days)</h4>
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

            {/* Graph for Predicted Prices */}
            <div style={{ marginTop: "20px" }}>
              <Line data={chartData} options={{ responsive: true, plugins: { title: { display: true, text: "Predicted Prices for Next 7 Days" } } }} />
            </div>
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
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <div className="products-section card">
        <h3>🌾 Your Products</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentProductData.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.quantity}</td>
                <td>
                  <button onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button onClick={() => setProductPage((p) => Math.max(p - 1, 1))} disabled={productPage === 1}>
            Previous
          </button>
          <span>
            Page {productPage} of {productTotalPages}
          </span>
          <button
            onClick={() => setProductPage((p) => Math.min(p + 1, productTotalPages))}
            disabled={productPage === productTotalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  predictButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 20px",
    cursor: "pointer",
  },
};

export default FarmerDashboard;
