const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`MongoDB unavailable: ${error.message}`);
    console.warn("Running in DEMO mode — data stored in memory only.");
    return false;
  }
};

module.exports = connectDB;
