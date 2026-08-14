const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// In-memory user store used when MongoDB is unavailable
const memoryUsers = new Map();

const isMemoryMode = () => process.env.DB_MODE === "memory";

let User;
try {
  User = require("../models/User");
} catch {
  User = null;
}

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMemoryMode()) {
      // In-memory fallback
      if (memoryUsers.has(normalizedEmail)) {
        return res.status(409).json({ message: "Email is already registered." });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = `mem_${Date.now()}`;
      memoryUsers.set(normalizedEmail, {
        _id: userId,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });
      const token = signToken(userId);
      return res.status(201).json({
        message: "User registered successfully.",
        token,
        user: { id: userId, name: name.trim(), email: normalizedEmail },
      });
    }

    // MongoDB path
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    const token = signToken(user._id);
    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMemoryMode()) {
      // In-memory fallback
      const user = memoryUsers.get(normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      const token = signToken(user._id);
      return res.status(200).json({
        message: "Login successful.",
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    }

    // MongoDB path
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = signToken(user._id);
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

module.exports = { register, login };
