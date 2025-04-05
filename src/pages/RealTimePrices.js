import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling


const FarmerDashboard = () => {
// Sample Crop Prices (Replace with API if available)
const mockCropPrices = {
    wheat: 2200,
    rice: 2500,
    maize: 1800,
    soybean: 4000,
    cotton: 6000,
  };
  const [cropPrices, setCropPrices] = useState(mockCropPrices);


  // Simulate Real-Time Price Updates Every 5 Seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCropPrices((prevPrices) => {
        const updatedPrices = {};
        Object.keys(prevPrices).forEach((crop) => {
          // Simulate price fluctuation (+/- 5%)
          const change = (Math.random() * 0.1 - 0.05) * prevPrices[crop];
          updatedPrices[crop] = Math.round(prevPrices[crop] + change);
        });
        return updatedPrices;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);


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
