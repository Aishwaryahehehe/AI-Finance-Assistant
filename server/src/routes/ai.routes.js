const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  predictTransactionCategory,
  forecastNextMonthExpenses,
  chatFinanceAdvice,
  detectSpendingAnomalies,
} = require("../controllers/ai.controller");

const router = express.Router();

router.use(protect);
router.post("/categorize", predictTransactionCategory);
router.get("/forecast-expenses", forecastNextMonthExpenses);
router.post("/chat", chatFinanceAdvice);
router.get("/spending-anomalies", detectSpendingAnomalies);

module.exports = router;
