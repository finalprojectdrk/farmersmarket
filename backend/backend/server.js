const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const smsRoutes = require("./routes/smsRoutes");

dotenv.config();

const app = express();

// ✅ Load environment variables
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// ✅ Middleware
app.use(express.json());

// ✅ CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://farmerssmarket.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);


// ✅ Preflight support (for OPTIONS)
app.options("*", cors());

// ✅ API Routes
app.use("/api", smsRoutes);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
