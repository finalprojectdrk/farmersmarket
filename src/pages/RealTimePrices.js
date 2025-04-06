import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  const [cropPrices, setCropPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch crop prices from the API provided
  useEffect(() => {
    const fetchCropPrices = async () => {
      try {
        // API URL with your API key and other parameters
        const url =
          "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000017704f08e67e4414747189afb9ef2d662&format=json&offset=0&limit=4000";
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch crop prices");
        }

        const data = await response.json();

        // Assuming that the crop prices are inside the "records" field in the response
        const records = data.records;

        // Map over the records and extract relevant information
        const formattedData = records.map((record) => ({
          crop: record.commodity,
          price: record.modal_price,
          market: record.market,
          date: record.date,
        }));

        // Set the fetched and formatted data into the state
        setCropPrices(formattedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCropPrices();

    // Optional: Refresh every 5 seconds
    const interval = setInterval(fetchCropPrices, 5000);

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []); // Empty dependency array ensures this effect runs only once

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
              <th>Market</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {/* Map over cropPrices data and display each crop */}
            {cropPrices.map((priceData, index) => (
              <tr key={index}>
                <td>{priceData.crop}</td>
                <td>₹ {priceData.price}</td>
                <td>{priceData.market}</td>
                <td>{priceData.date}</td>
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
