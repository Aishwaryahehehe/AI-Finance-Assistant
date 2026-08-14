const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    baseCurrency: {
      type: String,
      default: "USD",
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
      maxlength: 80,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
