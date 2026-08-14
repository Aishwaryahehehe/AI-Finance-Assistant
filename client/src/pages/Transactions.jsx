import { useEffect, useState } from "react";

const mockTransactions = [
  { id: "1", date: "2026-04-19", description: "Salary", category: "Income", type: "income", amount: 75000 },
  { id: "2", date: "2026-04-20", description: "Groceries", category: "Food", type: "expense", amount: 3200 },
  { id: "3", date: "2026-04-20", description: "Internet Bill", category: "Utilities", type: "expense", amount: 999 },
  { id: "4", date: "2026-04-18", description: "Freelance", category: "Income", type: "income", amount: 18000 },
  { id: "5", date: "2026-04-17", description: "Ride Share", category: "Transport", type: "expense", amount: 450 },
  { id: "6", date: "2026-04-16", description: "Dining", category: "Food", type: "expense", amount: 1200 },
  { id: "7", date: "2026-03-15", description: "Rent", category: "Housing", type: "expense", amount: 22000 },
  { id: "8", date: "2026-03-10", description: "Gym Membership", category: "Health", type: "expense", amount: 1500 },
  { id: "9", date: "2026-03-05", description: "Bonus", category: "Income", type: "income", amount: 10000 },
  { id: "10", date: "2026-02-28", description: "Electric Bill", category: "Utilities", type: "expense", amount: 2200 },
];

const money = (v) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(v);

export default function Transactions() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ description: "", category: "", type: "expense", amount: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/transactions?limit=100", { headers: { Authorization: `Bearer ${token}` } })
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
      .catch(() => {});
  }, []);

  const filtered = transactions.filter((t) => {
    const matchType = filter === "all" || t.type === filter;
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const newT = {
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      description: form.description,
      category: form.category,
      type: form.type,
      amount: Number(form.amount),
    };

    if (token) {
      setLoading(true);
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ description: form.description, category: form.category, type: form.type, amount: Number(form.amount), transactionDate: new Date() }),
        });
        const data = await res.json();
        if (res.ok && data.transaction) {
          newT.id = data.transaction._id;
        }
      } catch {}
      setLoading(false);
    }

    setTransactions((prev) => [newT, ...prev]);
    setForm({ description: "", category: "", type: "expense", amount: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Finance</p>
            <h1 className="text-3xl font-black">Transactions</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            + Add Transaction
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-bold mb-4">New Transaction</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <input required value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/60 transition-all">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount" className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <button type="submit" disabled={loading} className="rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 py-2.5 text-sm disabled:opacity-60 transition-all hover:from-emerald-300 hover:to-cyan-300">
                {loading ? "Saving..." : "Add"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <div className="flex gap-2">
            {["all", "income", "expense"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  filter === f
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No transactions found.</td></tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{t.date}</td>
                      <td className="px-4 py-3 font-medium">{t.description}</td>
                      <td className="px-4 py-3 text-slate-400">{t.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.type === "income" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.type === "income" ? "+" : "-"}{money(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {filtered.length} of {transactions.length} transactions
          </div>
        </div>
      </div>
    </div>
  );
}
