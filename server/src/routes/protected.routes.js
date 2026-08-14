const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const User = require("../models/User");

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Protected route accessed successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch protected data.", error: error.message });
  }
});

module.exports = router;
