const User = require("../models/User");

const registerUser = async (req, res) => {
  const { name, email, password, role, location, phone } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered." });

    const newUser = new User({ name, email, password, role, location, phone });
    await newUser.save();
    res.status(201).json({ message: "Registration successful!" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

module.exports = { registerUser };
