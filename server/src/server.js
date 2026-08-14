const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing. Add it to server/.env before starting.");
    process.exit(1);
  }

  const dbConnected = await connectDB();
  if (!dbConnected) {
    // Enable in-memory fallback mode
    process.env.DB_MODE = "memory";
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (process.env.DB_MODE === "memory") {
      console.log("⚠️  DEMO MODE: Using in-memory store (data resets on restart)");
    }
  });
};

startServer();
