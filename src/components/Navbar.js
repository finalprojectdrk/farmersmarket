import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../images/logo.png";

const Navbar = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userType = localStorage.getItem("userType"); // Get user role
  const navigate = useNavigate();

  
  return (
    <nav className="navbar">
      <div className="logo-container">
                <img src={logo} alt="FarmTrek Logo" className="navbar-logo" />
                <h2 className="navbar-menu">FarmTrek</h2>
      </div>
      <ul className="navbar-menu">
        <li>
          <Link to="/">Home</Link>
        </li>

        {isLoggedIn ? (
          <>
            {userType === "farmer" && (
              <>
                <li>
                  <Link to="/farmer-dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/farmer-profile">Profile</Link> {/* Profile Link Added */}
                </li>
              </>
            )}
            {userType === "buyer" && (
              <>
              <li>
                <Link to="/buyer-dashboard">Buyer dashboard</Link>
              </li>
              <li>
                <Link to="/buyer-profile">Profile</Link> {/* Profile Link Added */}
              </li>
              </>
            )}
            
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
