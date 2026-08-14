# AI Personal Finance Manager

Initial full-stack setup for an AI-powered personal finance management web app.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- AI Service: Python + scikit-learn + Flask

## Project Structure

```text
final_proj/
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/     # Business logic modules
│   │   ├── middleware/      # Auth/error middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/
│   │   │   └── health.routes.js
│   │   ├── app.js
│   │   └── server.js
│   └── .env.example
├── .env.example
└── package.json             # Root scripts for running both apps
```

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai_finance_db
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
```

You can copy from the provided `.env.example` files.

## Run the App

### 1) Install dependencies

From project root:

```bash
npm run install:all
```

Install Python dependencies:

```bash
pip install -r ai-service/requirements.txt
```

### 2) Start both frontend and backend

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- AI model service: `http://localhost:8000`

## Useful Scripts

- `npm run dev`: Run frontend + backend concurrently
- `npm run dev:client`: Run only React frontend
- `npm run dev:server`: Run only Express backend
- `npm run dev:ai`: Run Python AI categorization service
- `npm run build`: Build frontend for production
- `npm run start`: Start backend in production mode

## Authentication API

- `POST /api/auth/register`
  - Body: `{ "name": "Jane", "email": "jane@mail.com", "password": "secret123" }`
- `POST /api/auth/login`
  - Body: `{ "email": "jane@mail.com", "password": "secret123" }`
- `GET /api/protected/me` (requires header `Authorization: Bearer <token>`)

Both register and login return a JWT token and user data.

## Transactions API

All transaction routes require:

- Header: `Authorization: Bearer <token>`

### Add transaction

- `POST /api/transactions`
- Body example:

```json
{
  "type": "expense",
  "amount": 54.2,
  "currency": "USD",
  "category": "Food",
  "description": "Groceries",
  "transactionDate": "2026-04-20T10:00:00.000Z",
  "account": "card",
  "tags": ["grocery", "weekly"]
}
```

### Fetch user transactions

- `GET /api/transactions`
- Optional query params:
  - `type=income|expense`
  - `category=Food`
  - `startDate=2026-04-01`
  - `endDate=2026-04-30`
  - `page=1`
  - `limit=20`

### Edit transaction

- `PUT /api/transactions/:id`
- Body: any editable subset of transaction fields

### Delete transaction

- `DELETE /api/transactions/:id`
- Soft deletes by setting `isDeleted=true`

## Budgeting API

All budget routes require:

- Header: `Authorization: Bearer <token>`

### Set monthly category budget

- `POST /api/budgets`
- Body example:

```json
{
  "category": "Food",
  "amountLimit": 300,
  "month": "2026-04",
  "currency": "USD",
  "thresholdPercent": 80
}
```

This creates or updates the monthly budget for that category.

### Get spending vs budget usage

- `GET /api/budgets/usage`
- Optional query: `month=YYYY-MM`

Returns each category budget with:

- `amountLimit`
- `spentAmount` (expense transactions in that month/category)
- `remainingAmount`
- `usagePercent`
- `alertLevel` (`normal`, `warning`, `exceeded`)

## AI Expense Categorization

### Train on sample dataset

- Dataset file: `ai-service/data/sample_expense_data.csv`
- Train endpoint: `POST http://localhost:8000/train`
- The model is also auto-trained on startup if no saved model exists.

### Predict category from text (Python API)

- Endpoint: `POST http://localhost:8000/predict`
- Body:

```json
{
  "text": "uber ride to airport"
}
```

### Use AI via backend API

- Endpoint: `POST /api/ai/categorize` (JWT required)
- Body:

```json
{
  "text": "grocery shopping at target"
}
```

### Auto-categorize while creating transactions

- `POST /api/transactions` supports:
  - `autoCategorize: true`
  - `description: "<expense text>"`
  - optional `category` (if omitted, backend asks AI model)

Example:

```json
{
  "type": "expense",
  "amount": 42.8,
  "description": "dinner at restaurant",
  "transactionDate": "2026-04-20T18:30:00.000Z",
  "autoCategorize": true
}
```

## Expense Forecasting (Time Series)

The AI Python service includes ARIMA-based forecasting for expenses.

### Python forecasting endpoint

- `POST http://localhost:8000/forecast/expenses`
- Body:

```json
{
  "monthlyExpenses": [420, 510, 560, 590, 640, 700],
  "months": ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"]
}
```

Returns the next month expense prediction.

### Backend integrated forecasting endpoint

- `GET /api/ai/forecast-expenses?monthsBack=6` (JWT required)

This endpoint:

- aggregates user expense history from transactions
- calls Python ARIMA service
- returns `history` + `nextMonthPrediction`

### Dashboard integration

The dashboard now shows a **Next Month Expense Forecast** card/chart using this API.

## AI Chatbot for Finance Advice

A simple rule-based chatbot is available through backend AI routes.

### Chat API

- `POST /api/ai/chat` (JWT required)
- Body:

```json
{
  "query": "Can I afford 120 this month?"
}
```

### Supported query types

- **Affordability checks** (e.g., "Can I afford 120?")
  - Uses current month income and expenses to estimate affordability.
- **Savings advice** (e.g., "How to save money?")
  - Uses spending patterns and budget context for suggestions.
- **General advice**
  - Returns baseline guidance when query intent is broad.

### Frontend integration

The dashboard includes an **AI Finance Assistant** panel with:

- quick action prompts
- free-text chat input
- contextual responses from `/api/ai/chat`

## Unusual Spending Detection

Statistical anomaly detection is available for expense monitoring and alerts.

### Detection API

- `GET /api/ai/spending-anomalies?days=90&limit=10` (JWT required)

### Method

- Uses a robust statistical approach:
  - median + MAD (Median Absolute Deviation)
  - robust z-score thresholds for:
    - overall spending pattern
    - category-specific spending pattern

### Response highlights

- `anomalies` list with:
  - transaction details
  - anomaly reason
  - robust z-score
- summary metadata:
  - analyzed window
  - total transactions analyzed
  - anomalies found

### Frontend alerts

Dashboard includes an **Unusual Spending Alerts** section that surfaces flagged transactions.

## Goal Tracking

Track savings goals with completion percentages and progress updates.

### Goal APIs (JWT required)

- `POST /api/goals` - create a savings goal
- `GET /api/goals` - list user goals with completion percentage
- `PATCH /api/goals/:id/progress` - update current saved amount

Create goal body example:

```json
{
  "title": "Emergency Fund",
  "targetAmount": 5000,
  "currentAmount": 1200,
  "category": "savings"
}
```

### Dashboard integration

The dashboard includes a **Savings Goals** section to:

- create goals
- track current vs target
- view completion percentage progress bars
