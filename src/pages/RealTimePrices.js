import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  const [cropPrices, setCropPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [totalPages, setTotalPages] = useState(1); // Track total number of pages

  const itemsPerPage = 10; // Set how many items you want per page

  // Fetch crop prices from the API with pagination
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=${
          (currentPage - 1) * itemsPerPage
        }&limit=${itemsPerPage}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }

        const data = await response.json();
        const records = data.records;

        // Assuming the API response also provides total number of records or pages.
        const totalRecords = data.totalRecords || 0; // Make sure to check this part based on your API response
        setTotalPages(Math.ceil(totalRecords / itemsPerPage));

        const formattedData = records.map((record) => ({
          crop: record.commodity,
          price: (parseFloat(record.modal_price) / 100).toFixed(2), // ₹/kg
          market: record.market,
          date: new Date(record.date).toLocaleDateString("en-IN"),
        }));

        setCropPrices(formattedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();
  }, [currentPage]); // Depend on currentPage to fetch new data when the page changes

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <div>Loading real-time crop prices...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">

     <div className="current-datetime">
        <h4>Current Date & Time: {currentDateTime}</h4>
      </div>
      {/* ✅ Real-Time Price Discovery Section */}
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
            {cropPrices.map((priceData, index) => (
              <tr key={index}>
                <td>{priceData.crop}</td>
                <td>₹ {priceData.price}</td>
                <td>{priceData.market}</td>
                <td>{currentDateTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* ✅ Listed Products Section */}
      <div className="products-section card">
        <h3>📦 Your Listed Products</h3>
        <ProductList />
      </div>
    </div>
  );
};

export default FarmerDashboard;
