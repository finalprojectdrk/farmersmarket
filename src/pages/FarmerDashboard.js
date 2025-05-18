import React from "react"; 
import { useNavigate } from "react-router-dom";
import "./FarmerDashboard.css"; 
import WeatherWidget from "../components/WeatherWidget";

// ✅ Import images at the top for better performance
import farmerImage from "../images/farmers.jpg";
import farmingTipsImg from "../images/farming_tips.jpg";
import marketInsightsImg from "../images/market_insights.jpg";
import govtSchemesImg from "../images/government_schemes.jpg";
import organicFarmingImg from "../images/organic_farming.jpg";
import eventsExposImg from "../images/events_expos.jpg";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const farmerData = JSON.parse(localStorage.getItem("farmerData"));

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userType");
      localStorage.removeItem("farmerData");
      navigate("/login");
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* 📌 Secondary Navbar */}
      <nav className="secondary-navbar">
        
        <button onClick={() => navigate("/real-time-prices")}>📊 Real-Time Prices</button>
        <button onClick={() => navigate("/supply-chain")}>🚜 Supply Chain</button>
      </nav>

      {/* ✅ Welcome Message */}
      <div className="welcome-message">
        <h2>👋 Welcome, {farmerData?.name || "Farmer"}!</h2>
        <p>We’re glad to have you here. Explore resources, check market prices, and grow your farming business with ease.</p>
      </div>

      <WeatherWidget location="Chennai" />

      {/* ✅ Farmer Profile Section */}
      {farmerData && (
        <div className="profile-section card">
          <h3>👨‍🌾 Farmer Profile</h3>
          <p><strong>Name:</strong> {farmerData.name}</p>
          <p><strong>Email:</strong> {farmerData.email}</p>
          <p><strong>Phone:</strong> {farmerData.phone}</p>
          <p><strong>Location:</strong> {farmerData.location}</p>
        </div>
      )}

      {/* 🖼️ Farmer Quotes Section */}
      <div className="quote-container">
        <img src={farmerImage} alt="Farmers working" className="quote-image" />
        <p className="quote-text">
          “The farmer is the only man in our economy who buys everything at retail, 
          sells everything at wholesale, and pays the freight both ways.”
        </p>
      </div>

      {/* 🌾 Attractive Farmer Resources Section */}
      <div className="resources-section">
        <h2>📢 Farmer Resources &0 Updates</h2>
        <div className="resources-grid">
          {[
            { img: farmingTipsImg, title: "🌱 Best Farming Practices", desc: "Learn modern techniques to increase crop yield and soil health.",url:" https://farmech.dac.gov.in/"},
            { img: marketInsightsImg, title: "📊 Market Insights", desc: "Get real-time crop prices and demand trends in different regions.",url: "https://agmarknet.gov.in/" },
            { img: govtSchemesImg, title: "🏦 Government Schemes", desc: "Check eligibility for farmer subsidies, loans, and support programs.",  url:" https://pmkisan.gov.in/"},
            { img: organicFarmingImg, title: "🌾 Organic Farming Tips", desc: "Discover eco-friendly ways to reduce chemicals and boost soil fertility." ,  url: "https://ncof.dacnet.nic.in/"},
            { img: eventsExposImg, title: "📅 Upcoming Events", desc: "Stay updated on agricultural expos, training programs, and workshops.",url: "https://www.krishijagran.com/events/" },
            { img: require("../images/soil_health.jpg"), title: "🧪 Soil Health & Testing", desc: "Learn how to test and improve soil fertility for better crop growth." , url:"https://pgsindia-ncof.gov.in/"}

          ].map((resource, index) => (
            <div className="resource-card" key={index}
            onClick={() => window.open(resource.url, "_blank")}
            style={{ cursor: "pointer" }} 
            >
              <img src={resource.img} alt={resource.title} />
              <h3>{resource.title}</h3>
              <p>{resource.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FarmerDashboard;
