import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  // State to hold crop prices
  const [cropPrices, setCropPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Tamil Nadu Government's real-time crop prices
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        // Replace with the API URL for Tamil Nadu crop prices (Example: "https://api.tn.gov.in/crop-prices")
        const response = await fetch("https://api.tn.gov.in/crop-prices");
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }
        const data = await response.json();

        // Assuming the response structure is like: { wheat: 2200, rice: 2500, ... }
        setCropPrices(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();

    // Optionally: If you want to refresh the data at regular intervals
    const interval = setInterval(fetchCropPrices, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []); // Empty dependency array means this effect runs once on component mount

  // Render loading state or error
  if (loading) {
    return <div>Loading real-time crop prices...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      {/* ✅ Real-Time Price Discovery Section */}
      <div className="price-section card">
        <h3>🌾 Real-Time Tamil Nadu Crop Prices</h3>
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Market Price (₹/Quintal)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cropPrices).map(([crop, price]) => (
              <tr key={crop}>
                <td>{crop.charAt(0).toUpperCase() + crop.slice(1)}</td>
                <td>₹ {price}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
