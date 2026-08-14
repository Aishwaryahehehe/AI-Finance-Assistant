const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { categorizeTransactionText } = require("../services/aiCategorizer.service");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeTransactionPayload = (payload) => {
  const normalized = { ...payload };

  if (typeof normalized.category === "string") {
    normalized.category = normalized.category.trim();
  }
  if (typeof normalized.description === "string") {
    normalized.description = normalized.description.trim();
  }
  if (typeof normalized.account === "string") {
    normalized.account = normalized.account.trim();
  }
  if (typeof normalized.currency === "string") {
    normalized.currency = normalized.currency.trim().toUpperCase();
  }
  if (Array.isArray(normalized.tags)) {
    normalized.tags = normalized.tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean);
  }

  return normalized;
};

const validateCreatePayload = (payload) => {
  const errors = [];

  if (!payload.type || !["income", "expense"].includes(payload.type)) {
    errors.push("type must be either 'income' or 'expense'.");
  }
  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    errors.push("amount must be a number greater than 0.");
  }
  if (!payload.category || typeof payload.category !== "string") {
    const canAutoCategorize =
      payload.autoCategorize === true &&
      typeof payload.description === "string" &&
      payload.description.trim().length > 0;

    if (!canAutoCategorize) {
      errors.push("category is required unless autoCategorize=true with a description.");
    }
  }
  if (!payload.transactionDate || Number.isNaN(Date.parse(payload.transactionDate))) {
    errors.push("transactionDate must be a valid date.");
  }

  return errors;
};

const addTransaction = async (req, res) => {
  try {
    const payload = normalizeTransactionPayload(req.body);
    const validationErrors = validateCreatePayload(payload);

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors: validationErrors });
    }

    let category = payload.category;
    let aiPrediction = null;

    if (!category && payload.autoCategorize === true && payload.description) {
      try {
        aiPrediction = await categorizeTransactionText(payload.description);
        category = aiPrediction.predictedCategory;
      } catch (error) {
        return res.status(502).json({
          message: "AI categorization failed. Provide category manually or retry later.",
          error: error.message,
        });
      }
    }

    const transaction = await Transaction.create({
      user: req.userId,
      type: payload.type,
      amount: payload.amount,
      currency: payload.currency || "USD",
      category,
      description: payload.description || "",
      transactionDate: payload.transactionDate,
      account: payload.account || "cash",
      tags: payload.tags || [],
      recurring: payload.recurring || undefined,
      metadata: payload.metadata || undefined,
    });

    return res.status(201).json({
      message: "Transaction added successfully.",
      transaction,
      aiCategoryPrediction: aiPrediction
        ? {
            predictedCategory: aiPrediction.predictedCategory,
            confidence: aiPrediction.confidence,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add transaction.", error: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query = {
      user: req.userId,
      isDeleted: false,
    };

    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({ message: "Invalid type filter." });
      }
      query.type = type;
    }

    if (category) {
      query.category = category.trim();
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (Number.isNaN(parsedStart.getTime())) {
          return res.status(400).json({ message: "Invalid startDate filter." });
        }
        query.transactionDate.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ message: "Invalid endDate filter." });
        }
        query.transactionDate.$lte = parsedEnd;
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Transactions fetched successfully.",
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch transactions.", error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction id." });
    }

    const payload = normalizeTransactionPayload(req.body);
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No update fields provided." });
    }

    if (payload.type && !["income", "expense"].includes(payload.type)) {
      return res.status(400).json({ message: "type must be either 'income' or 'expense'." });
    }
    if (payload.amount !== undefined && (typeof payload.amount !== "number" || payload.amount <= 0)) {
      return res.status(400).json({ message: "amount must be a number greater than 0." });
    }
    if (
      payload.transactionDate !== undefined &&
      Number.isNaN(new Date(payload.transactionDate).getTime())
    ) {
      return res.status(400).json({ message: "transactionDate must be a valid date." });
    }

    const allowedFields = [
      "type",
      "amount",
      "currency",
      "category",
      "description",
      "transactionDate",
      "account",
      "tags",
      "recurring",
      "metadata",
    ];

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowedFields.includes(key))
    );

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, user: req.userId, isDeleted: false },
      sanitizedUpdates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    return res.status(200).json({
      message: "Transaction updated successfully.",
      transaction: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update transaction.", error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction id." });
    }

    const deleted = await Transaction.findOneAndUpdate(
      { _id: id, user: req.userId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    return res.status(200).json({ message: "Transaction deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete transaction.", error: error.message });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
