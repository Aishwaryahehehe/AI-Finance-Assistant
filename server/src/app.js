const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const transactionRoutes = require("./routes/transaction.routes");
const budgetRoutes = require("./routes/budget.routes");
const aiRoutes = require("./routes/ai.routes");
const goalRoutes = require("./routes/goal.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Personal Finance API" });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

// Routes that require MongoDB — return graceful error in demo/memory mode
const dbRequired = (req, res, next) => {
  if (process.env.DB_MODE === "memory") {
    return res.status(503).json({
      message: "Database unavailable. Running in demo mode — connect MongoDB for full functionality.",
      demoMode: true,
    });
  }
  return next();
};

app.use("/api/transactions", dbRequired, transactionRoutes);
app.use("/api/budgets", dbRequired, budgetRoutes);
app.use("/api/ai", aiRoutes);   // AI chat works in both modes
app.use("/api/goals", dbRequired, goalRoutes);

module.exports = app;
