import React, { useState, useEffect } from "react";

const SupplyChain = () => {
  // Dummy supply chain data (Replace with API or database)
  const initialOrders = [
    { id: 1, crop: "Wheat", buyer: "AgroMart Pvt Ltd", status: "Pending", transport: "Truck - TN 45 AB 6789" },
    { id: 2, crop: "Rice", buyer: "Green Farmers Co.", status: "In Transit", transport: "Van - TN 22 XY 4321" },
    { id: 3, crop: "Maize", buyer: "Local Retailer", status: "Delivered", transport: "Truck - TN 10 ZZ 9876" },
  ];

  const [orders, setOrders] = useState(initialOrders);

  // Simulate real-time updates (Change status randomly every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.status === "Pending") return { ...order, status: "In Transit" };
          if (order.status === "In Transit") return { ...order, status: "Delivered" };
          return order;
        })
      );
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <h2>🚜 Supply Chain Management</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Buyer</th>
            <th>Status</th>
            <th>Transport</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.crop}</td>
              <td>{order.buyer}</td>
              <td style={styles.status[order.status]}>{order.status}</td>
              <td>{order.transport}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ✅ Inline CSS for Styling
const styles = {
  container: {
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  status: {
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
};

export default SupplyChain;
