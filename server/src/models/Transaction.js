const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: "USD",
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    account: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "cash",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly", null],
        default: null,
      },
      nextRunDate: { type: Date, default: null },
    },
    metadata: {
      source: {
        type: String,
        enum: ["manual", "bank_sync", "import_csv", "ai_generated"],
        default: "manual",
      },
      externalId: { type: String, trim: true, maxlength: 120 },
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

transactionSchema.index({ user: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, "metadata.externalId": 1 }, { sparse: true });
transactionSchema.index({ user: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
