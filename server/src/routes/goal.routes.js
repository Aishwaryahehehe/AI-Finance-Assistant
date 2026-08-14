const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { createGoal, getGoals, updateGoalProgress } = require("../controllers/goal.controller");

const router = express.Router();

router.use(protect);
router.post("/", createGoal);
router.get("/", getGoals);
router.patch("/:id/progress", updateGoalProgress);

module.exports = router;
