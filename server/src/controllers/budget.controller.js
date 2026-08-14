const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const parseMonthWindow = (monthValue) => {
  const now = new Date();
  const source = typeof monthValue === "string" && monthValue ? `${monthValue}-01T00:00:00.000Z` : now;
  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  return { startDate, endDate };
};

const setMonthlyBudget = async (req, res) => {
  try {
    const { category, amountLimit, month, currency, thresholdPercent } = req.body;

    if (!category || typeof category !== "string") {
      return res.status(400).json({ message: "category is required." });
    }
    if (typeof amountLimit !== "number" || amountLimit <= 0) {
      return res.status(400).json({ message: "amountLimit must be a number greater than 0." });
    }

    const monthWindow = parseMonthWindow(month);
    if (!monthWindow) {
      return res.status(400).json({ message: "month must be valid (YYYY-MM)." });
    }

    const normalizedCategory = category.trim();
    const normalizedCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : "USD";
    const alertThreshold =
      typeof thresholdPercent === "number" && thresholdPercent >= 1 && thresholdPercent <= 100
        ? thresholdPercent
        : 80;

    const budgetName = `${normalizedCategory} - ${monthWindow.startDate.toISOString().slice(0, 7)}`;

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.userId,
        category: normalizedCategory,
        period: "monthly",
        startDate: monthWindow.startDate,
        endDate: monthWindow.endDate,
        isDeleted: false,
      },
      {
        $set: {
          name: budgetName,
          amountLimit,
          currency: normalizedCurrency,
          alerts: {
            thresholdPercent: alertThreshold,
            notificationsEnabled: true,
          },
          status: "active",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: "Monthly budget saved successfully.",
      budget,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save monthly budget.", error: error.message });
  }
};

const getBudgetUsage = async (req, res) => {
  try {
    const monthWindow = parseMonthWindow(req.query.month);
    if (!monthWindow) {
      return res.status(400).json({ message: "month must be valid (YYYY-MM)." });
    }

    const budgets = await Budget.find({
      user: req.userId,
      period: "monthly",
      startDate: monthWindow.startDate,
      endDate: monthWindow.endDate,
      isDeleted: false,
      status: { $in: ["active", "paused"] },
    }).sort({ category: 1 });

    const usage = await Promise.all(
      budgets.map(async (budget) => {
        const spentAgg = await Transaction.aggregate([
          {
            $match: {
              user: budget.user,
              isDeleted: false,
              type: "expense",
              category: budget.category,
              transactionDate: {
                $gte: budget.startDate,
                $lte: budget.endDate,
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const spentAmount = spentAgg[0]?.total || 0;
        const limit = budget.amountLimit;
        const usagePercent = limit > 0 ? (spentAmount / limit) * 100 : 0;
        const remaining = Math.max(limit - spentAmount, 0);
        const threshold = budget.alerts?.thresholdPercent || 80;

        let alertLevel = "normal";
        if (usagePercent >= 100) {
          alertLevel = "exceeded";
        } else if (usagePercent >= threshold) {
          alertLevel = "warning";
        }

        return {
          _id: budget._id,
          category: budget.category,
          month: budget.startDate.toISOString().slice(0, 7),
          amountLimit: limit,
          spentAmount: Number(spentAmount.toFixed(2)),
          remainingAmount: Number(remaining.toFixed(2)),
          usagePercent: Number(usagePercent.toFixed(2)),
          thresholdPercent: threshold,
          alertLevel,
          currency: budget.currency,
        };
      })
    );

    return res.status(200).json({
      message: "Budget usage fetched successfully.",
      period: {
        startDate: monthWindow.startDate,
        endDate: monthWindow.endDate,
      },
      budgets: usage,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch budget usage.", error: error.message });
  }
};

module.exports = {
  setMonthlyBudget,
  getBudgetUsage,
};
