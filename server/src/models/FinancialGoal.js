const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    achieved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const financialGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 400,
      default: "",
    },
    category: {
      type: String,
      enum: ["emergency_fund", "debt_payoff", "savings", "investment", "custom"],
      default: "custom",
      index: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: "USD",
    },
    startDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    targetDate: {
      type: Date,
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
      index: true,
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    linkedTransactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

financialGoalSchema.index({ user: 1, status: 1, targetDate: 1 });
financialGoalSchema.index({ user: 1, category: 1, priority: 1 });
financialGoalSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model("FinancialGoal", financialGoalSchema);
