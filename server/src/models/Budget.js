const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      index: true,
    },
    amountLimit: {
      type: Number,
      required: true,
      min: 0.01,
    },
    spentAmount: {
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
    period: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly", "custom"],
      required: true,
      default: "monthly",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    alerts: {
      thresholdPercent: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "archived"],
      default: "active",
      index: true,
    },
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

budgetSchema.index({ user: 1, category: 1, startDate: 1, endDate: 1 }, { unique: true });
budgetSchema.index({ user: 1, status: 1, endDate: 1 });
budgetSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });

budgetSchema.pre("validate", function validateDates(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error("startDate must be before or equal to endDate."));
  }
  return next();
});

module.exports = mongoose.model("Budget", budgetSchema);
