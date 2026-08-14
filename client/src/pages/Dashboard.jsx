import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const mockTransactions = [
  { id: "1", date: "2026-04-19", description: "Salary", category: "Income", type: "income", amount: 75000 },
  { id: "2", date: "2026-04-20", description: "Groceries", category: "Food", type: "expense", amount: 3200 },
  { id: "3", date: "2026-04-20", description: "Internet Bill", category: "Utilities", type: "expense", amount: 999 },
  { id: "4", date: "2026-04-18", description: "Freelance", category: "Income", type: "income", amount: 18000 },
  { id: "5", date: "2026-04-17", description: "Ride Share", category: "Transport", type: "expense", amount: 450 },
  { id: "6", date: "2026-04-16", description: "Dining", category: "Food", type: "expense", amount: 1200 },
];

const PIE_COLORS = ["#10b981", "#38bdf8", "#a78bfa", "#f59e0b", "#f43f5e"];
const money = (v) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(v);

export default function Dashboard() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLoading(true);
    fetch("/api/transactions?limit=50", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(data.transactions.map((t) => ({
            id: t._id, date: new Date(t.transactionDate).toISOString().slice(0, 10),
            description: t.description || t.category, category: t.category,
            type: t.type, amount: Number(t.amount),
          })));
        }
      })
      .catch(() => setError("Showing sample data — backend unavailable."))
      .finally(() => setIsLoading(false));
  }, []);

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const barData = [
    { name: "Income", value: +summary.income.toFixed(2) },
    { name: "Expenses", value: +summary.expenses.toFixed(2) },
    { name: "Balance", value: +summary.balance.toFixed(2) },
  ];

  const pieData = useMemo(() => {
    const totals = transactions.filter((t) => t.type === "expense")
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    return Object.entries(totals).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Overview</p>
            <h1 className="text-3xl font-black">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/analysis" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
              Full Analysis →
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">{error}</div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Income", value: money(summary.income), color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
            { label: "Total Expenses", value: money(summary.expenses), color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
            { label: "Balance", value: money(summary.balance), color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5" },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border ${c.border} ${c.bg} p-6`}>
              <p className="text-sm text-slate-400 mb-2">{c.label}</p>
              <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
              {isLoading && <p className="text-xs text-slate-500 mt-1">Updating...</p>}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-bold mb-4 text-slate-200">Income vs Expenses</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={["#10b981", "#f43f5e", "#38bdf8"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-bold mb-4 text-slate-200">Expense Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40} label={({ name }) => name}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-200">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 6).map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-3 text-slate-400 text-xs">{t.date}</td>
                    <td className="px-3 py-3 font-medium">{t.description}</td>
                    <td className="px-3 py-3 text-slate-400">{t.category}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.type === "income" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right font-bold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.type === "income" ? "+" : "-"}{money(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Transactions", to: "/transactions", icon: "💳", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/20" },
            { label: "Budgets", to: "/budgets", icon: "📊", color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/20" },
            { label: "Goals", to: "/goals", icon: "🎯", color: "from-violet-500/20 to-purple-500/20 border-violet-500/20" },
            { label: "AI Chatbot", to: "/chatbot", icon: "🤖", color: "from-amber-500/20 to-orange-500/20 border-amber-500/20" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-2xl border bg-gradient-to-br ${item.color} p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg`}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-sm font-semibold text-slate-200">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
