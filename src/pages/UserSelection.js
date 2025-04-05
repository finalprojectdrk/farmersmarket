import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserSelection.css";

const UserSelection = () => {
  const navigate = useNavigate();

  const selectRole = (role) => {
    localStorage.setItem("userRole", role);
    
    if (role === "buyer") {
      navigate("/buyer-dashboard");
    } else {
      navigate("/farmer-dasboard");
    }
  };

  return (
    <div className="user-selection">
      <h2>Welcome! Choose Your Role</h2>
      <div className="role-buttons">
        <button onClick={() => selectRole("farmer")}>Farmer</button>
        <button onClick={() => selectRole("buyer")}>Buyer</button>
      </div>
    </div>
  );
};

export default UserSelection;
