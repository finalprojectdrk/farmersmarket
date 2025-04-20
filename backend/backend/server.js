const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const smsRoutes = require("./routes/smsRoutes");

dotenv.config();

const app = express();

// ✅ CORS Configuration
app.use(
  cors({
    origin: "https://farmerssmarket.com", // Allow only the frontend domain
    methods: ["GET", "POST"], // Allow only GET and POST methods
    allowedHeaders: ["Content-Type"], // Allow Content-Type header
  })
);

// ✅ Enable preflight OPTIONS requests for CORS (handle preflight request)
app.options("*", cors());  // Allow OPTIONS requests for all routes

app.use(express.json());

// API routes
app.use("/api", smsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
