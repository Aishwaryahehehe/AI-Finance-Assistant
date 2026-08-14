import { useEffect, useState } from "react";

const mockGoals = [
  { _id: "g1", title: "Emergency Fund", targetAmount: 200000, currentAmount: 72000, completionPercent: 36, status: "active", category: "savings" },
  { _id: "g2", title: "Vacation Savings", targetAmount: 80000, currentAmount: 80000, completionPercent: 100, status: "completed", category: "travel" },
  { _id: "g3", title: "New Laptop", targetAmount: 90000, currentAmount: 36000, completionPercent: 40, status: "active", category: "tech" },
];

const money = (v) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(v);

const categoryEmoji = { savings: "💰", travel: "✈️", tech: "💻", health: "🏥", education: "📚", home: "🏠", other: "🎯" };

export default function Goals() {
  const [goals, setGoals] = useState(mockGoals);
  const [form, setForm] = useState({ title: "", targetAmount: "", currentAmount: "", category: "savings" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/goals", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.goals) && data.goals.length > 0) setGoals(data.goals); })
      .catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    const target = Number(form.targetAmount);
    const current = Number(form.currentAmount || 0);
    if (!form.title.trim() || target <= 0 || current < 0) { setError("Please fill in valid goal details."); return; }

    const token = localStorage.getItem("token");
    const newG = {
      _id: String(Date.now()),
      title: form.title.trim(),
      targetAmount: target,
      currentAmount: current,
      completionPercent: Math.min((current / target) * 100, 100),
      status: current >= target ? "completed" : "active",
      category: form.category,
    };

    if (token) {
      setLoading(true);
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: form.title.trim(), targetAmount: target, currentAmount: current, category: form.category }),
        });
        const data = await res.json();
        if (res.ok && data.goal) newG._id = data.goal._id;
        else if (!res.ok) { setError(data.message || "Failed to create goal."); setLoading(false); return; }
      } catch { setError("Unable to save goal right now."); setLoading(false); return; }
      setLoading(false);
    }

    setGoals((prev) => [newG, ...prev]);
    setForm({ title: "", targetAmount: "", currentAmount: "", category: "savings" });
    setShowForm(false);
  };

  const active = goals.filter((g) => g.status !== "completed");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Finance</p>
            <h1 className="text-3xl font-black">Savings Goals</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            + New Goal
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Goals", value: goals.length, color: "text-slate-200" },
            { label: "Active", value: active.length, color: "text-cyan-400" },
            { label: "Completed", value: completed.length, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-bold mb-4">Create New Goal</h2>
            {error && <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Goal name" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 transition-all">
                {Object.keys(categoryEmoji).map((c) => <option key={c} value={c}>{categoryEmoji[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <input required type="number" min="1" value={form.targetAmount} onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))} placeholder="Target amount (₹)" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <input type="number" min="0" value={form.currentAmount} onChange={(e) => setForm((p) => ({ ...p, currentAmount: e.target.value }))} placeholder="Current amount (₹)" className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <button type="submit" disabled={loading} className="sm:col-span-2 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm disabled:opacity-60 transition-all hover:from-emerald-300 hover:to-cyan-300">
                {loading ? "Creating..." : "Create Goal"}
              </button>
            </form>
          </div>
        )}

        {/* Active Goals */}
        {active.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-300 mb-3">Active Goals</h2>
            <div className="space-y-4">
              {active.map((g) => {
                const pct = Math.min(Math.max(g.completionPercent || 0, 0), 100);
                return (
                  <div key={g._id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryEmoji[g.category] || "🎯"}</span>
                        <div>
                          <h3 className="font-bold text-lg">{g.title}</h3>
                          <p className="text-xs text-slate-500 capitalize">{g.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-cyan-400">{pct.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">complete</p>
                      </div>
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Saved: <span className="text-emerald-400 font-semibold">{money(g.currentAmount || 0)}</span></span>
                      <span className="text-slate-400">Target: <span className="text-slate-200 font-semibold">{money(g.targetAmount || 0)}</span></span>
                      <span className="text-slate-400">Left: <span className="text-cyan-400 font-semibold">{money(Math.max((g.targetAmount || 0) - (g.currentAmount || 0), 0))}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completed.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-300 mb-3">Completed Goals 🎉</h2>
            <div className="space-y-3">
              {completed.map((g) => (
                <div key={g._id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryEmoji[g.category] || "🎯"}</span>
                    <div>
                      <h3 className="font-bold">{g.title}</h3>
                      <p className="text-xs text-slate-500">{money(g.targetAmount)} goal reached</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
