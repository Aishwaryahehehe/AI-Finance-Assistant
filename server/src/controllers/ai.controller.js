const isMemoryMode = () => process.env.DB_MODE === "memory";

// Lazy-load mongoose models only when DB is available
let Transaction, Budget;
const getModels = () => {
  if (!Transaction) Transaction = require("../models/Transaction");
  if (!Budget) Budget = require("../models/Budget");
};

const { categorizeTransactionText, forecastMonthlyExpenses } = require("../services/aiCategorizer.service");

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

// ─── Smart rule-based finance advisor (works without DB) ───────────────────
const buildSmartAdvice = (query) => {
  const q = query.toLowerCase();

  // Extract any dollar/number amount from query
  const amountMatch = q.match(/\$?\s*(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

  // ── Affordability ──
  if (q.match(/\bafford\b|\bcan i (buy|spend|get|purchase)\b/)) {
    if (amount) {
      if (amount < 50)  return { intent: "affordability", advice: `$${amount} is a small purchase. As long as it's not a daily habit, it should be fine. Just make sure it fits within your discretionary budget for the month. 💡 Tip: Track it so you stay aware of small spending adding up.` };
      if (amount < 200) return { intent: "affordability", advice: `$${amount} is a moderate expense. Before spending, ask yourself: Is this a need or a want? Do I have this in my budget? Will this affect any upcoming bills? If yes to all — go for it! ✅` };
      if (amount < 500) return { intent: "affordability", advice: `$${amount} is a significant purchase. I'd recommend: 1) Check your current month's balance first. 2) Make sure your emergency fund is intact. 3) If it's not urgent, wait 48 hours before deciding — this avoids impulse buys. 🛒` };
      return { intent: "affordability", advice: `$${amount} is a large purchase. Before committing: ✅ Ensure you have 3-6 months of expenses saved as emergency fund. ✅ Check if this can be financed interest-free. ✅ Compare prices across 3 sources. ✅ Ask: does this align with my financial goals?` };
    }
    return { intent: "affordability", advice: `To check affordability, tell me the amount — e.g. "Can I afford $300?" 💬 In general: a purchase is affordable if it's under 10% of your monthly take-home pay and doesn't dip into your emergency fund.` };
  }

  // ── Saving tips ──
  if (q.match(/\bsav(e|ing|ings)\b|\bcut (cost|expense|spending)\b|\breduce (bill|spend)\b/)) {
    return { intent: "saving", advice: `Here are proven ways to save more money 💰:\n\n1. **50/30/20 Rule** — 50% needs, 30% wants, 20% savings\n2. **Automate savings** — set up auto-transfer on payday\n3. **Cancel unused subscriptions** — audit monthly recurring charges\n4. **Meal prep** — reduces food spending by 30-40%\n5. **Use cashback apps** — earn back on everyday purchases\n6. **Energy audit** — unplug devices, switch to LED bulbs\n7. **Buy generic brands** — same quality, 20-40% cheaper\n\nStart with just one habit this week! 🚀` };
  }

  // ── Budgeting ──
  if (q.match(/\bbudget(ing)?\b|\btrack(ing)? (spend|expense|money)\b|\bhow (do i|to) manage\b/)) {
    return { intent: "budgeting", advice: `Budgeting made simple 📊:\n\n**Step 1:** List all income sources\n**Step 2:** List fixed expenses (rent, utilities, subscriptions)\n**Step 3:** List variable expenses (food, transport, entertainment)\n**Step 4:** Assign limits to each category\n**Step 5:** Review weekly — adjust as needed\n\n💡 Use the **Budgets** section in this app to set category limits and get alerts before you overspend!` };
  }

  // ── Emergency fund ──
  if (q.match(/\bemergency fund\b|\brainy day\b|\bsafety net\b/)) {
    return { intent: "emergency_fund", advice: `Building an emergency fund 🛡️:\n\n**Goal:** 3-6 months of living expenses\n**How to start:**\n1. Open a separate high-yield savings account\n2. Start with a small goal — even $500 makes a difference\n3. Auto-transfer a fixed amount every payday\n4. Use windfalls (tax refunds, bonuses) to boost it\n5. Don't touch it unless it's a true emergency\n\n**Rule of thumb:** If you lost your job today, how long could you survive? That's your target! 💪` };
  }

  // ── Investing ──
  if (q.match(/\binvest(ing|ment)?\b|\bstock(s)?\b|\bmutual fund\b|\bindex fund\b|\bretirement\b|\b401k\b|\bira\b/)) {
    return { intent: "investing", advice: `Smart investing basics 📈:\n\n1. **Pay off high-interest debt first** (>7% interest)\n2. **Max out employer 401k match** — it's free money\n3. **Build emergency fund** before investing\n4. **Index funds** — low cost, diversified, long-term proven\n5. **Dollar-cost averaging** — invest a fixed amount monthly regardless of market\n6. **Time in market > timing the market** — start early, stay consistent\n\n⚠️ This is general education, not financial advice. Consult a licensed advisor for personalized investment plans.` };
  }

  // ── Debt ──
  if (q.match(/\bdebt\b|\bloan\b|\bcredit card\b|\bpay off\b|\bowe\b/)) {
    return { intent: "debt", advice: `Tackling debt strategically 💳:\n\n**Avalanche Method** (saves most money):\n→ Pay minimums on all debts, put extra toward highest interest rate first\n\n**Snowball Method** (best for motivation):\n→ Pay minimums on all debts, put extra toward smallest balance first\n\n**Quick wins:**\n• Call lenders to negotiate lower rates\n• Consolidate high-interest debt\n• Avoid new debt while paying off existing\n• Celebrate each debt paid off! 🎉\n\nWhich method fits your personality better?` };
  }

  // ── Income / side hustle ──
  if (q.match(/\bincome\b|\bearn (more|extra)\b|\bside (hustle|job|gig)\b|\bfreelance\b/)) {
    return { intent: "income", advice: `Ways to boost your income 💼:\n\n**Quick wins:**\n• Freelance your skills (writing, design, coding, tutoring)\n• Sell unused items online\n• Cashback & rewards credit cards\n\n**Medium term:**\n• Upskill with online courses (Coursera, Udemy)\n• Negotiate a raise at your current job\n• Rent out a room or parking space\n\n**Long term:**\n• Build a passive income stream (content, digital products)\n• Dividend investing\n\nWhat skills do you have that others would pay for? 🤔` };
  }

  // ── Credit score ──
  if (q.match(/\bcredit score\b|\bcredit report\b|\bcredit history\b/)) {
    return { intent: "credit", advice: `Improving your credit score 📋:\n\n**Key factors:**\n• Payment history (35%) — never miss a payment\n• Credit utilization (30%) — keep below 30% of limit\n• Credit age (15%) — keep old accounts open\n• Credit mix (10%) — variety of credit types\n• New inquiries (10%) — avoid applying for too much credit\n\n**Quick tips:**\n✅ Set up autopay for minimums\n✅ Request credit limit increases\n✅ Check your report for errors (free at annualcreditreport.com)\n✅ Become an authorized user on a trusted person's card` };
  }

  // ── Rent vs buy ──
  if (q.match(/\brent(ing)?\b.*\bbuy(ing)?\b|\bbuy(ing)?\b.*\brent(ing)?\b|\bhome (buy|purchase|own)\b/)) {
    return { intent: "rent_vs_buy", advice: `Rent vs Buy — the real answer 🏠:\n\n**Buy if:**\n• You plan to stay 5+ years\n• You have 20% down payment saved\n• Your mortgage ≤ 28% of gross income\n• You have stable income and emergency fund\n\n**Rent if:**\n• You might move in <3 years\n• Local home prices are very high\n• You value flexibility\n• You're still building your financial foundation\n\n💡 Use the "price-to-rent ratio" — divide home price by annual rent. If >20, renting is often smarter financially.` };
  }

  // ── Expense / spending analysis ──
  if (q.match(/\b(biggest|top|most|highest) (expense|spend|category)\b|\bwhere (am i|do i) spend\b/)) {
    return { intent: "spending_analysis", advice: `To see your biggest expense categories 📊, head to the **Financial Analysis** page — it shows a full breakdown of where your money goes.\n\nCommon spending traps to watch:\n• 🍔 Food & dining (often 15-25% of budget)\n• 🚗 Transport (aim for under 15%)\n• 📱 Subscriptions (audit these monthly!)\n• 🛍️ Impulse purchases (use a 24-hour rule)\n\nAdd your transactions in the **Transactions** section to get personalized insights!` };
  }

  // ── Greetings ──
  if (q.match(/^(hi|hello|hey|good (morning|afternoon|evening)|howdy|sup|what'?s up)/)) {
    return { intent: "greeting", advice: `Hey there! 👋 I'm your AI Finance Assistant.\n\nI can help you with:\n💰 Saving money & budgeting\n📊 Understanding your spending\n💳 Managing debt & credit\n📈 Investing basics\n🎯 Reaching financial goals\n\nWhat's on your mind today?` };
  }

  // ── Thank you ──
  if (q.match(/\b(thank(s| you)|thx|ty|appreciate)\b/)) {
    return { intent: "thanks", advice: `You're welcome! 😊 Remember, small consistent steps lead to big financial wins. Feel free to ask me anything else — I'm here to help you make smarter money decisions! 💪` };
  }

  // ── Goals ──
  if (q.match(/\b(financial )?goal(s)?\b|\bsave for\b|\bplan(ning)? (for|to)\b/)) {
    return { intent: "goals", advice: `Setting financial goals that stick 🎯:\n\n**SMART Goals framework:**\n• **S**pecific — "Save $5,000 for emergency fund"\n• **M**easurable — track monthly progress\n• **A**chievable — realistic given your income\n• **R**elevant — aligned with your life priorities\n• **T**ime-bound — "by December 2026"\n\n**Pro tip:** Break big goals into monthly milestones. Use the **Goals** section in this app to track your progress visually! 📈` };
  }

  // ── Default fallback ──
  return {
    intent: "general",
    advice: `Great question! Here are some universal financial principles 💡:\n\n1. **Spend less than you earn** — the foundation of wealth\n2. **Track every expense** — awareness is the first step\n3. **Build an emergency fund** — 3-6 months of expenses\n4. **Avoid lifestyle inflation** — as income grows, save more\n5. **Invest early** — compound interest is powerful\n\nCould you be more specific? Try asking things like:\n• "How do I save money?"\n• "Can I afford $500?"\n• "How do I pay off debt?"\n• "What's a good budget strategy?"`,
  };
};

// ─── Controllers ───────────────────────────────────────────────────────────

const predictTransactionCategory = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "text is required and must be a string." });
    }
    const prediction = await categorizeTransactionText(text.trim());
    return res.status(200).json({ message: "Category prediction successful.", prediction });
  } catch (error) {
    return res.status(502).json({ message: "Failed to get prediction from AI model service.", error: error.message });
  }
};

const forecastNextMonthExpenses = async (req, res) => {
  if (isMemoryMode()) {
    return res.status(200).json({
      message: "Forecast unavailable in demo mode.",
      forecast: {
        method: "demo",
        history: [],
        nextMonthPrediction: 0,
      },
    });
  }

  try {
    getModels();
    const monthsBack = Math.min(Math.max(parseInt(req.query.monthsBack, 10) || 6, 3), 24);
    const now = new Date();
    const startMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1), 1));

    const monthly = await Transaction.aggregate([
      { $match: { user: req.userId, isDeleted: false, type: "expense", transactionDate: { $gte: startMonth, $lte: now } } },
      { $group: { _id: { year: { $year: "$transactionDate" }, month: { $month: "$transactionDate" } }, totalExpense: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyMap = new Map(monthly.map((item) => [`${item._id.year}-${String(item._id.month).padStart(2, "0")}`, Number(item.totalExpense.toFixed(2))]));
    const monthLabels = [];
    const expenseValues = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      monthLabels.push(key);
      expenseValues.push(monthlyMap.get(key) || 0);
    }

    if (expenseValues.every((v) => v === 0)) {
      return res.status(200).json({ message: "Not enough expense history to forecast.", forecast: { method: "insufficient_data", history: monthLabels.map((month, idx) => ({ month, expense: expenseValues[idx] })), nextMonthPrediction: 0 } });
    }

    const forecast = await forecastMonthlyExpenses(expenseValues, monthLabels);
    return res.status(200).json({ message: "Expense forecast generated successfully.", forecast });
  } catch (error) {
    return res.status(502).json({ message: "Failed to generate expense forecast.", error: error.message });
  }
};

const chatFinanceAdvice = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "query is required and must be a string." });
    }

    const trimmedQuery = query.trim();

    // In memory/demo mode — use smart rule-based engine only
    if (isMemoryMode()) {
      const { intent, advice } = buildSmartAdvice(trimmedQuery);
      return res.status(200).json({
        message: "Finance advice generated.",
        intent,
        advice,
        context: { demoMode: true },
      });
    }

    // With MongoDB — enrich advice with real user data
    try {
      getModels();
      const { start, end } = getCurrentMonthRange();

      const [monthlyTotals, categorySpend, monthlyBudgets] = await Promise.all([
        Transaction.aggregate([
          { $match: { user: req.userId, isDeleted: false, transactionDate: { $gte: start, $lte: end } } },
          { $group: { _id: "$type", total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { user: req.userId, isDeleted: false, type: "expense", transactionDate: { $gte: start, $lte: end } } },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
          { $limit: 3 },
        ]),
        Budget.find({ user: req.userId, isDeleted: false }).select("category amountLimit"),
      ]);

      const totalsMap = new Map(monthlyTotals.map((item) => [item._id, Number(item.total.toFixed(2))]));
      const income = totalsMap.get("income") || 0;
      const expenses = totalsMap.get("expense") || 0;
      const balance = Number((income - expenses).toFixed(2));
      const topCategory = categorySpend[0]?._id || null;
      const topCategoryAmount = categorySpend[0]?.total ? Number(categorySpend[0].total.toFixed(2)) : 0;

      const q = trimmedQuery.toLowerCase();
      let advice, intent;

      // Affordability with real data
      if (q.match(/\bafford\b|\bcan i (buy|spend|get|purchase)\b/)) {
        const amountMatch = q.match(/\$?\s*(\d+(?:\.\d+)?)/);
        const requestedAmount = amountMatch ? parseFloat(amountMatch[1]) : null;
        intent = "affordability";

        if (!requestedAmount) {
          advice = `Your balance this month is **$${balance.toFixed(2)}** (Income: $${income.toFixed(2)}, Expenses: $${expenses.toFixed(2)}). Tell me a specific amount to check affordability — e.g. "Can I afford $200?"`;
        } else {
          const canAfford = balance >= requestedAmount;
          const remaining = (balance - requestedAmount).toFixed(2);
          advice = canAfford
            ? `✅ Yes, you can likely afford **$${requestedAmount}**!\n\nYour current month balance: **$${balance.toFixed(2)}**\nAfter this purchase: **$${remaining}**\n\n💡 Just make sure this doesn't eat into your emergency fund or savings goal.`
            : `⚠️ This looks tight right now.\n\nYour current month balance: **$${balance.toFixed(2)}**\nYou'd be short by: **$${(requestedAmount - balance).toFixed(2)}**\n\nConsider waiting until next month or finding a way to reduce expenses first.`;
        }
      }
      // Saving tips with real data
      else if (q.match(/\bsav(e|ing|ings)\b|\bcut (cost|expense|spending)\b/)) {
        intent = "saving";
        const topTip = topCategory
          ? `Your biggest expense this month is **${topCategory}** ($${topCategoryAmount.toFixed(2)}). That's a great place to start cutting.`
          : "Add your transactions to see where you spend the most.";
        advice = `${topTip}\n\n**Your month so far:** Income $${income.toFixed(2)} | Expenses $${expenses.toFixed(2)} | Balance $${balance.toFixed(2)}\n\n**Top saving tips:**\n1. Automate savings on payday\n2. Use the 50/30/20 rule\n3. Cancel unused subscriptions\n4. Meal prep to cut food costs\n5. Set category budgets in this app to get alerts before overspending`;
      }
      // Spending analysis with real data
      else if (q.match(/\b(biggest|top|most|highest) (expense|spend|category)\b|\bwhere (am i|do i) spend\b/)) {
        intent = "spending_analysis";
        const topList = categorySpend.map((c, i) => `${i + 1}. **${c._id}** — $${Number(c.total).toFixed(2)}`).join("\n");
        advice = topList
          ? `Your top expense categories this month 📊:\n\n${topList}\n\nTotal expenses: **$${expenses.toFixed(2)}** | Income: **$${income.toFixed(2)}** | Balance: **$${balance.toFixed(2)}**\n\nHead to **Financial Analysis** for a full visual breakdown!`
          : "No expense data yet this month. Add transactions to see your spending breakdown!";
      }
      // Default — use smart engine but prepend real context
      else {
        const smart = buildSmartAdvice(trimmedQuery);
        intent = smart.intent;
        const contextLine = income > 0
          ? `📊 *Your month: Income $${income.toFixed(2)} | Expenses $${expenses.toFixed(2)} | Balance $${balance.toFixed(2)}*\n\n`
          : "";
        advice = contextLine + smart.advice;
      }

      return res.status(200).json({
        message: "Finance advice generated.",
        intent,
        advice,
        context: { income, expenses, balance, topCategory, topCategoryAmount },
      });
    } catch (dbError) {
      // DB query failed — fall back to smart engine
      const { intent, advice } = buildSmartAdvice(trimmedQuery);
      return res.status(200).json({ message: "Finance advice generated.", intent, advice, context: {} });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate finance advice.", error: error.message });
  }
};

const detectSpendingAnomalies = async (req, res) => {
  if (isMemoryMode()) {
    return res.status(200).json({ message: "Anomaly detection unavailable in demo mode.", detection: { anomalies: [] } });
  }

  try {
    getModels();
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 90, 30), 365);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setUTCDate(endDate.getUTCDate() - days);

    const expenses = await Transaction.find({ user: req.userId, isDeleted: false, type: "expense", transactionDate: { $gte: startDate, $lte: endDate } })
      .sort({ transactionDate: -1 })
      .select("amount category description transactionDate");

    if (expenses.length < 8) {
      return res.status(200).json({ message: "Not enough expense history for anomaly detection.", detection: { method: "robust_zscore_mad", windowDays: days, minRequiredTransactions: 8, anomalies: [] } });
    }

    const allAmounts = expenses.map((tx) => Number(tx.amount));
    const baselineMedian = median(allAmounts);
    const absoluteDeviations = allAmounts.map((v) => Math.abs(v - baselineMedian));
    const mad = median(absoluteDeviations) || 1;

    const categoryStats = new Map();
    for (const tx of expenses) {
      const key = tx.category || "Other";
      if (!categoryStats.has(key)) categoryStats.set(key, []);
      categoryStats.get(key).push(Number(tx.amount));
    }

    const anomalies = expenses
      .map((tx) => {
        const amount = Number(tx.amount);
        const category = tx.category || "Other";
        const robustZ = 0.6745 * ((amount - baselineMedian) / mad);
        const categoryAmounts = categoryStats.get(category) || [];
        const categoryMedian = median(categoryAmounts);
        const categoryMad = median(categoryAmounts.map((v) => Math.abs(v - categoryMedian))) || 1;
        const categoryRobustZ = 0.6745 * ((amount - categoryMedian) / categoryMad);
        const isGlobalOutlier = robustZ >= 3.5;
        const isCategoryOutlier = categoryAmounts.length >= 4 && categoryRobustZ >= 3.2;
        const isAnomaly = isGlobalOutlier || isCategoryOutlier;
        let reason = null;
        if (isGlobalOutlier) reason = "Unusually high compared to your overall spending pattern.";
        else if (isCategoryOutlier) reason = `Unusually high for ${category} expenses.`;
        return { _id: tx._id, amount, category, description: tx.description || category, transactionDate: tx.transactionDate, robustZScore: Number(robustZ.toFixed(2)), categoryRobustZScore: Number(categoryRobustZ.toFixed(2)), reason, isAnomaly };
      })
      .filter((tx) => tx.isAnomaly)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);

    return res.status(200).json({ message: "Spending anomaly detection completed.", detection: { method: "robust_zscore_mad", windowDays: days, totalExpensesAnalyzed: expenses.length, anomaliesFound: anomalies.length, anomalies } });
  } catch (error) {
    return res.status(500).json({ message: "Failed to detect spending anomalies.", error: error.message });
  }
};

module.exports = { predictTransactionCategory, forecastNextMonthExpenses, chatFinanceAdvice, detectSpendingAnomalies };
