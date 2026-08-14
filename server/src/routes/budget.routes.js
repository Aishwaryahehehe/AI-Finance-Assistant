const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { setMonthlyBudget, getBudgetUsage } = require("../controllers/budget.controller");

const router = express.Router();

router.use(protect);

router.post("/", setMonthlyBudget);
router.get("/usage", getBudgetUsage);

module.exports = router;
