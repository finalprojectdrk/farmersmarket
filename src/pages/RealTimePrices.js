import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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

  const recordsPerPage = 10;

  // Fetch Crop Prices
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        const url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000";
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

        const q = query(
          collection(db, "products"),
          where("farmerEmail", "==", user.email)
        );
        const querySnapshot = await getDocs(q);

        const fetchedProducts = [];
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() });
        });

        setProducts(fetchedProducts);
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

  const filteredData = allCropPrices.filter(
    (priceData) =>
      priceData.crop.toLowerCase().includes(filter.toLowerCase()) ||
      priceData.market.toLowerCase().includes(filter.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
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
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price (₹)</th>
                <th>Quantity (kg)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.productName}</td>
                  <td>₹ {product.price}</td>
                  <td>{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No products listed yet!</p>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
