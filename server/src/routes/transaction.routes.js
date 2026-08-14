const express = require("express");
const {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transaction.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/", addTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
