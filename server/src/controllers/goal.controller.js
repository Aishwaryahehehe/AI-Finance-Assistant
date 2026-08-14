const mongoose = require("mongoose");
const FinancialGoal = require("../models/FinancialGoal");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const computeCompletion = (goal) => {
  const target = Number(goal.targetAmount || 0);
  const current = Number(goal.currentAmount || 0);
  const completionPercent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return Number(completionPercent.toFixed(2));
};

const createGoal = async (req, res) => {
  try {
    const { title, targetAmount, currentAmount = 0, targetDate, category = "savings", priority = "medium" } =
      req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "title is required." });
    }
    if (typeof targetAmount !== "number" || targetAmount <= 0) {
      return res.status(400).json({ message: "targetAmount must be a number greater than 0." });
    }
    if (typeof currentAmount !== "number" || currentAmount < 0) {
      return res.status(400).json({ message: "currentAmount must be a number >= 0." });
    }

    const goal = await FinancialGoal.create({
      user: req.userId,
      title: title.trim(),
      targetAmount,
      currentAmount,
      targetDate: targetDate || null,
      category,
      priority,
      status: currentAmount >= targetAmount ? "completed" : "active",
    });

    return res.status(201).json({
      message: "Savings goal created successfully.",
      goal: {
        ...goal.toObject(),
        completionPercent: computeCompletion(goal),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create savings goal.", error: error.message });
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await FinancialGoal.find({
      user: req.userId,
      isDeleted: false,
      status: { $in: ["active", "completed", "paused"] },
    }).sort({ createdAt: -1 });

    const enriched = goals.map((goal) => ({
      ...goal.toObject(),
      completionPercent: computeCompletion(goal),
    }));

    return res.status(200).json({
      message: "Goals fetched successfully.",
      goals: enriched,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch goals.", error: error.message });
  }
};

const updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid goal id." });
    }

    const { currentAmount } = req.body;
    if (typeof currentAmount !== "number" || currentAmount < 0) {
      return res.status(400).json({ message: "currentAmount must be a number >= 0." });
    }

    const goal = await FinancialGoal.findOne({ _id: id, user: req.userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    goal.currentAmount = currentAmount;
    goal.status = currentAmount >= goal.targetAmount ? "completed" : "active";
    await goal.save();

    return res.status(200).json({
      message: "Goal progress updated successfully.",
      goal: {
        ...goal.toObject(),
        completionPercent: computeCompletion(goal),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update goal progress.", error: error.message });
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoalProgress,
};
