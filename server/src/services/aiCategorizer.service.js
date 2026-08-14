const AI_API_URL = process.env.AI_MODEL_API_URL || "http://localhost:8000";

const categorizeTransactionText = async (text) => {
  const response = await fetch(`${AI_API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "AI categorization request failed.");
  }

  return data;
};

const forecastMonthlyExpenses = async (monthlyExpenses, months) => {
  const response = await fetch(`${AI_API_URL}/forecast/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ monthlyExpenses, months }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "AI forecasting request failed.");
  }

  return data;
};

module.exports = {
  categorizeTransactionText,
  forecastMonthlyExpenses,
};
