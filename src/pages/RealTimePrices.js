import React, { useState, useEffect } from "react";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  // State for storing crop prices
  const [cropPrices, setCropPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const url =
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000";

  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }
        const data = await response.json();

        // Debugging: log the API response
        console.log("API Response: ", data);

        // Assuming data.records contains the crop price data
        setCropPrices(data.records); // Store the records from the response
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();
  }, []); // Empty dependency array to run only once on mount

  // Render loading state or error
  if (loading) {
    return <div>Loading crop prices...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="price-section card">
        <h3>🌾 Real-Time Crop Prices</h3>
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Price (₹/Quintal)</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {cropPrices.length > 0 ? (
              cropPrices.map((crop, index) => (
                <tr key={index}>
                  <td>{crop.commodity_name}</td>
                  <td>{crop.market_price}</td>
                  <td>{crop.market_name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FarmerDashboard;
