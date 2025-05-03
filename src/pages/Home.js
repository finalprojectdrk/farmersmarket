import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import bgImage from "../images/marketplace-bg.jpg";
import farmerIcon from "../images/farmer-icon.png";
import buyerIcon from "../images/buyer-icon.png";
import marketIcon from "../images/marketplace2.png";

import UploadProducts from '../UploadProducts';
// ...
<UploadProducts />

const Home = () => {
  const navigate = useNavigate();

  // Fetch logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user")); 
  // user example: { id: 123, role: 'farmer' } or { id: 456, role: 'buyer' }

  const handleFarmerClick = () => {
    if (user?.role === "farmer") {
      navigate("/farmer-dashboard");
    } else if (user) {
      alert("Access Denied: Only Farmers can access this section.");
    } else {
      navigate("/register");
    }
  };

  const handleBuyerClick = () => {
    if (user?.role === "buyer") {
      navigate("/buyer-dashboard");
    } else if (user) {
      alert("Access Denied: Only Buyers can access this section.");
    } else {
      navigate("/register");
    }
  };

  const handleMarketplaceClick = () => {
    navigate("/marketplace");
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: `url(${bgImage})` }}>
        <h1>Welcome to FarmTrek</h1>
        <p>Connecting Farmers & Buyers for a better marketplace</p>
        <button className="cta-button" onClick={() => navigate("/register")}>
          Get Started
        </button>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card" onClick={handleFarmerClick}>
          <img src={farmerIcon} alt="Farmer" />
          <h3>For Farmers</h3>
          <p>Get real-time price updates & sell your produce efficiently.</p>
        </div>

        <div className="feature-card" onClick={handleBuyerClick}>
          <img src={buyerIcon} alt="Buyer" />
          <h3>For Buyers</h3>
          <p>Search & order fresh produce directly from farmers.</p>
        </div>

        <div className="feature-card" onClick={handleMarketplaceClick}>
          <img src={marketIcon} alt="Marketplace" />
          <h3>Marketplace</h3>
          <p>Experience a transparent & fair supply chain system.</p>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-us">
        <div className="about-content">
          <div className="about-text">
            <h2>Empowering Farmers, Connecting Buyers</h2>
            <p>
              Farmers Market is a digital platform that bridges the gap between
              farmers and buyers, ensuring fair pricing, transparency, and a
              better supply chain.
            </p>

            <ul>
              <li>🌱 <strong>For Farmers:</strong> Get the best prices for your produce.</li>
              <li>🛒 <strong>For Buyers:</strong> Access fresh & organic food directly from farmers.</li>
              <li>🔗 <strong>For Communities:</strong> Build a sustainable, transparent food supply chain.</li>
            </ul>

            <div className="stats">
              <p>✅ <strong>500+</strong> farmers onboarded</p>
              <p>✅ <strong>1000+</strong> successful transactions</p>
              <p>✅ Covering <strong>50+</strong> local markets</p>
            </div>

            <blockquote>
              "We believe in fair trade, sustainable farming, and empowering rural communities."
            </blockquote>
          </div>

          <div className="about-image">
            <img src={require("../images/about-farmers.avif")} alt="Farmers working" />
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="contact">
        <h2>Contact Us</h2>
        <p>Have questions? Reach out to us!</p>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Farmers Market. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="/about">About Us</a>
          <a href="/contact">Contact</a>
          <a href="/terms">Terms & Conditions</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
