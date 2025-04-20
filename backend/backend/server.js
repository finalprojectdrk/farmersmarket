const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const smsRoutes = require("./routes/smsRoutes");

dotenv.config();

const app = express();

// ✅ CORS: Allow only frontend domain
app.use(cors({
  origin: "https://farmerssmarket.com"
}));

app.use(express.json());

// API routes
app.use("/api", smsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
