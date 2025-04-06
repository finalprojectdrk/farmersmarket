import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  const [cropPrices, setCropPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [allCropPrices, setAllCropPrices] = useState([]); // Store all crop prices for pagination
  const [filter, setFilter] = useState(""); // State to store filter input
  const recordsPerPage = 10; // Number of records per page

  // Fetch crop prices from the API
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        // API URL with your API key and other parameters (fetching all records)
        const url =
          "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000"; // A large limit to get all records
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }

        const data = await response.json();
        const records = data.records;

        // Map over the records and format them
        const formattedData = records.map((record) => {
          const priceInKg = parseFloat(record.modal_price) / 100;
          return {
            crop: record.commodity,
            price: priceInKg.toFixed(2),
            market: record.market,
            date: new Date().toLocaleString(), // Current date and time
          };
        });

        setAllCropPrices(formattedData);
        setTotalPages(Math.ceil(formattedData.length / recordsPerPage)); // Calculate total pages
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();
  }, []); // Only fetch once when component mounts

  // Update current date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString();
      setCurrentDateTime(formattedDate);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

  // Get the filtered crop prices (with pagination applied)
  const filteredData = allCropPrices.filter(
    (priceData) =>
      priceData.crop.toLowerCase().includes(filter.toLowerCase()) ||
      priceData.market.toLowerCase().includes(filter.toLowerCase())
  );

  // Get the crop prices for the current page
  const currentData = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to the first page when filter changes
  };

  if (loading) {
    return <div>Loading real-time crop prices...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      {/* ✅ Real-Time Date and Time */}
      <div className="current-datetime">
        <h4>Current Date & Time: {currentDateTime}</h4>
      </div>

      {/* ✅ Filter Section 
      <div className="filter-section">
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Search by crop or market..."
        />
      </div>*/}

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
            {/* Map over currentData (page-specific data) */}
            {currentData.map((priceData, index) => (
              <tr key={index}>
                <td>{priceData.crop}</td>
                <td>₹ {priceData.price}</td>
                <td>{priceData.market}</td>
                <td>{currentDateTime}</td>
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

      {/* ✅ Listed Products Section */}
      <div className="products-section card">
        <h3>📦 Your Listed Products</h3>
        <ProductList />
      </div>
    </div>
  );
};

export default FarmerDashboard;
