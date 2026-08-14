import { useEffect, useState } from "react";

const mockBudgets = [
  { _id: "b1", category: "Food", amountLimit: 12000, spentAmount: 8416, remainingAmount: 3584, usagePercent: 70.13, alertLevel: "normal" },
  { _id: "b2", category: "Transport", amountLimit: 5000, spentAmount: 4271, remainingAmount: 729, usagePercent: 85.42, alertLevel: "warning" },
  { _id: "b3", category: "Utilities", amountLimit: 3500, spentAmount: 3695, remainingAmount: 0, usagePercent: 105.56, alertLevel: "exceeded" },
  { _id: "b4", category: "Health", amountLimit: 6000, spentAmount: 1800, remainingAmount: 4200, usagePercent: 30, alertLevel: "normal" },
  { _id: "b5", category: "Entertainment", amountLimit: 4000, spentAmount: 3120, remainingAmount: 880, usagePercent: 78, alertLevel: "normal" },
];

const money = (v) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(v);

export default function Budgets() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [form, setForm] = useState({ category: "", amountLimit: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/budgets/usage", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.budgets) && data.budgets.length > 0) setBudgets(data.budgets); })
      .catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const newB = {
      _id: String(Date.now()),
      category: form.category,
      amountLimit: Number(form.amountLimit),
      spentAmount: 0,
      remainingAmount: Number(form.amountLimit),
      usagePercent: 0,
      alertLevel: "normal",
    };

    if (token) {
      setLoading(true);
      try {
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ category: form.category, amountLimit: Number(form.amountLimit), currency: "USD" }),
        });
        const data = await res.json();
        if (res.ok && data.budget) newB._id = data.budget._id;
      } catch {}
      setLoading(false);
    }

    setBudgets((prev) => [newB, ...prev]);
    setForm({ category: "", amountLimit: "" });
    setShowForm(false);
  };

  const alertConfig = {
    normal: { bar: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "On Track" },
    warning: { bar: "bg-amber-500", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Warning" },
    exceeded: { bar: "bg-rose-500", badge: "bg-rose-500/20 text-rose-400 border-rose-500/30", label: "Exceeded" },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Finance</p>
            <h1 className="text-3xl font-black">Budgets</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            + New Budget
          </button>
        </div>

        {/* Alerts */}
        {budgets.filter((b) => b.alertLevel !== "normal").length > 0 && (
          <div className="space-y-2">
            {budgets.filter((b) => b.alertLevel !== "normal").map((b) => (
              <div key={`alert-${b._id}`} className={`rounded-xl px-4 py-3 text-sm border ${b.alertLevel === "exceeded" ? "border-rose-500/40 bg-rose-500/10 text-rose-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300"}`}>
                {b.alertLevel === "exceeded" ? "🚨" : "⚠️"} <strong>{b.category}</strong> budget {b.alertLevel === "exceeded" ? "exceeded" : "nearing limit"} — {b.usagePercent.toFixed(1)}% used
              </div>
            ))}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-bold mb-4">Create Budget</h2>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
              <input required value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category (e.g. Food)" className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <input required type="number" min="1" value={form.amountLimit} onChange={(e) => setForm((p) => ({ ...p, amountLimit: e.target.value }))} placeholder="Monthly limit (₹)" className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm disabled:opacity-60 transition-all">
                {loading ? "Saving..." : "Create"}
              </button>
            </form>
          </div>
        )}

        {/* Budget Cards */}
        <div className="space-y-4">
          {budgets.map((b) => {
            const cfg = alertConfig[b.alertLevel] || alertConfig.normal;
            const pct = Math.min(Math.max(b.usagePercent, 0), 100);
            return (
              <div key={b._id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{b.category}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-200">{money(b.spentAmount)} <span className="text-slate-500 font-normal">/ {money(b.amountLimit)}</span></p>
                    <p className="text-xs text-slate-500">{b.usagePercent.toFixed(1)}% used</p>
                  </div>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>Spent: {money(b.spentAmount)}</span>
                  <span>Remaining: <span className={b.alertLevel === "exceeded" ? "text-rose-400" : "text-emerald-400"}>{money(Math.max(b.remainingAmount, 0))}</span></span>
                  <span>Limit: {money(b.amountLimit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
