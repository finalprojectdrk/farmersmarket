import React, { useState, useEffect } from "react";
import ProductList from "../components/ProductList";
import "./FarmerDashboard.css"; // Import CSS for styling

const FarmerDashboard = () => {
  const [cropPrices, setCropPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");

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

        // Map over the records and extract relevant information, performing calculations
        const formattedData = records.map((record) => {
          // Convert price from ₹/quintal to ₹/kg (multiply by 100)
          const priceInKg = parseFloat(record.modal_price) / 100;

          // Format the date to a more readable format (e.g., DD/MM/YYYY)
          const formattedDate = new Date(record.date).toLocaleDateString("en-IN");

          return {
            crop: record.commodity,
            price: priceInKg.toFixed(2), // rounded to two decimal places (₹/kg)
            market: record.market,
            date: formattedDate,
          };
        });

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

  // Update current date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString(); // You can customize the format as needed
      setCurrentDateTime(formattedDate);
    };

    updateDateTime(); // Set initial date and time
    const interval = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

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

      {/* ✅ Real-Time Price Discovery Section */}
      <div className="price-section card">
        <h3>🌾 Real-Time Crop Prices</h3>
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Market Price (₹/kg)</th>
              <th>Market</th>
              <th>Date</th> {/* Updated header */}
            </tr>
          </thead>
          <tbody>
            {/* Map over cropPrices data and display each crop */}
            {cropPrices.map((priceData, index) => (
              <tr key={index}>
                <td>{priceData.crop}</td>
                <td>₹ {priceData.price}</td>
                <td>{priceData.market}</td>
                <td>{priceData.date}</td> {/* Display formatted date */}
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
