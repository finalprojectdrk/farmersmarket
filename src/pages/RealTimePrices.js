import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  // State to hold crop prices
  const [cropPrices, setCropPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Tamil Nadu Government's real-time crop prices from API
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        const url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }
        const data = await response.json();

        // Log the response data to check the structure
        console.log(data);

        // Assuming data records contain fields like 'commodity' and 'market_price'
        const cropData = data.records.reduce((acc, record) => {
          const cropName = record.commodity;  // Modify according to actual field names
          const price = record.market_price;  // Modify according to actual field names
          if (cropName && price) {
            acc[cropName] = price;
          }
          return acc;
        }, {});

        setCropPrices(cropData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();

    // Optionally: Refresh the data every 5 seconds (you can adjust the interval)
    const interval = setInterval(fetchCropPrices, 5000);

    return () => clearInterval(interval); // Clean up the interval when component unmounts
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
        <h3>🌾 Real-Time Crop Prices</h3>
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
