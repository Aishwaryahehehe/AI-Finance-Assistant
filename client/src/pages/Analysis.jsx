import { useState, useMemo, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

const CATEGORIES = [
  "Food", "Transport", "Utilities", "Housing", "Healthcare",
  "Entertainment", "Education", "Shopping", "Income", "Other",
];

const CAT_COLORS = {
  Food: "#fb923c",
  Transport: "#60a5fa",
  Utilities: "#a78bfa",
  Housing: "#f472b6",
  Healthcare: "#34d399",
  Entertainment: "#fbbf24",
  Education: "#22d3ee",
  Shopping: "#f87171",
  Income: "#4ade80",
  Other: "#94a3b8",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n) {
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
}

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: "Food",
  type: "expense",
  amount: "",
};

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 12, padding: "10px 16px", backdropFilter: "blur(8px)" }}>
      <p style={{ color: "#c7d2fe", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 700 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function Analysis() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("overview");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [formError, setFormError] = useState("");
  const fileRef = useRef();

  /* ── Derived KPIs ── */
  const { totalIncome, totalExpenses, savings, savingsRate, byCategory, byMonth, anomalies } = useMemo(() => {
    const totalIncome = entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalExpenses = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;

    const catMap = {};
    entries.filter(e => e.type === "expense").forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const byCategory = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }));

    const monthMap = {};
    entries.forEach(e => {
      const d = new Date(e.date);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expenses: 0 };
      if (e.type === "income") monthMap[key].income += e.amount;
      else monthMap[key].expenses += e.amount;
    });
    const byMonth = Object.values(monthMap).sort((a, b) => new Date("1 " + a.month) - new Date("1 " + b.month));

    const expAmounts = entries.filter(e => e.type === "expense").map(e => e.amount);
    let anomalies = [];
    if (expAmounts.length >= 3) {
      const mean = expAmounts.reduce((s, v) => s + v, 0) / expAmounts.length;
      const std = Math.sqrt(expAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / expAmounts.length);
      anomalies = entries.filter(e => e.type === "expense" && e.amount > mean + 2 * std);
    }
    return { totalIncome, totalExpenses, savings, savingsRate, byCategory, byMonth, anomalies };
  }, [entries]);

  /* ── Forecast ── */
  const forecastData = useMemo(() => {
    if (byMonth.length < 2) return [];
    const history = byMonth.map(m => ({ month: m.month, value: m.expenses, type: "actual" }));
    const window = byMonth.slice(-3).map(m => m.expenses);
    const predicted = Math.round(window.reduce((s, v) => s + v, 0) / window.length);
    const lastMonth = byMonth[byMonth.length - 1].month;
    const [mon, yr] = lastMonth.split(" ");
    const nextIdx = (MONTHS.indexOf(mon) + 1) % 12;
    const nextYr = nextIdx === 0 ? parseInt(yr) + 1 : parseInt(yr);
    return [...history, { month: `${MONTHS[nextIdx]} ${nextYr}`, value: predicted, type: "forecast" }];
  }, [byMonth]);

  /* ── Handlers ── */
  function handleAdd(e) {
    e.preventDefault();
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setFormError("Enter a valid amount."); return; }
    setFormError("");
    setEntries(prev => [{ ...form, amount: parseFloat(form.amount), id: Date.now() }, ...prev]);
    setForm(EMPTY_FORM);
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  async function handleScanBill(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanMsg("Scanning bill…");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("http://localhost:8000/scan-bill", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.extracted) {
        const ex = data.extracted;
        setForm({
          date: ex.date || new Date().toISOString().slice(0, 10),
          description: ex.description || "Scanned Bill",
          category: CATEGORIES.includes(ex.category) ? ex.category : "Other",
          type: "expense",
          amount: ex.amount ? String(ex.amount) : "",
        });
        setScanMsg(data.demo ? "⚠ Demo mode — OCR not installed. Fields pre-filled." : "✓ Bill scanned successfully!");
      } else {
        setScanMsg("Could not extract details. Fill in manually.");
      }
    } catch {
      setScanMsg("AI service unavailable. Fill in manually.");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";
  const inputStyle = { background: "rgba(30,41,59,0.8)", border: "1px solid rgba(99,102,241,0.25)" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #1a1a4e 40%, #0d1b3e 100%)", paddingTop: 80, paddingBottom: 60 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
              📊
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Financial Analysis</h1>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Track expenses, scan bills, and visualize your financial health</p>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Income", value: fmt(totalIncome), icon: "💰", grad: "linear-gradient(135deg,#065f46,#047857)", glow: "rgba(16,185,129,0.3)", val: "#4ade80" },
            { label: "Total Expenses", value: fmt(totalExpenses), icon: "💸", grad: "linear-gradient(135deg,#7f1d1d,#991b1b)", glow: "rgba(239,68,68,0.3)", val: "#f87171" },
            { label: "Net Savings", value: fmt(savings), icon: "🏦", grad: savings >= 0 ? "linear-gradient(135deg,#1e3a5f,#1d4ed8)" : "linear-gradient(135deg,#7c2d12,#c2410c)", glow: savings >= 0 ? "rgba(59,130,246,0.3)" : "rgba(249,115,22,0.3)", val: savings >= 0 ? "#60a5fa" : "#fb923c" },
            { label: "Savings Rate", value: `${savingsRate}%`, icon: "📈", grad: "linear-gradient(135deg,#3b0764,#6d28d9)", glow: "rgba(139,92,246,0.3)", val: "#c4b5fd" },
          ].map(k => (
            <div key={k.label} style={{ background: k.grad, borderRadius: 18, padding: "20px 22px", boxShadow: `0 8px 32px ${k.glow}`, border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -10, fontSize: 52, opacity: 0.12 }}>{k.icon}</div>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>{k.label}</p>
              <p style={{ color: k.val, fontSize: 26, fontWeight: 800, margin: 0, textShadow: `0 0 20px ${k.glow}` }}>{k.value}</p>
              <span style={{ fontSize: 22 }}>{k.icon}</span>
            </div>
          ))}
        </div>

        {/* ── Entry Form + List ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* Entry Form */}
          <div style={{ background: "rgba(15,23,42,0.7)", borderRadius: 20, padding: 28, border: "1px solid rgba(99,102,241,0.2)", backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
            <h2 style={{ color: "#a5b4fc", fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 8, padding: "4px 8px", fontSize: 13 }}>+ Add Entry</span>
            </h2>

            {/* Bill Scan */}
            <div style={{ marginBottom: 20, padding: "16px 18px", borderRadius: 14, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: "1px dashed rgba(139,92,246,0.5)" }}>
              <p style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📷 Scan a Bill Image</p>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span style={{ padding: "8px 18px", background: scanning ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", boxShadow: "0 4px 15px rgba(99,102,241,0.4)", transition: "all 0.2s" }}>
                  {scanning ? "⏳ Scanning…" : "📁 Upload Image"}
                </span>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScanBill} disabled={scanning} />
                <span style={{ color: "#64748b", fontSize: 12 }}>JPG · PNG · PDF</span>
              </label>
              {scanMsg && (
                <p style={{ marginTop: 8, fontSize: 12, color: scanMsg.startsWith("✓") ? "#4ade80" : scanMsg.startsWith("⚠") ? "#fbbf24" : "#f87171" }}>{scanMsg}</p>
              )}
            </div>

            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls} style={inputStyle}>
                    <option value="expense">💸 Expense</option>
                    <option value="income">💰 Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Description / Reason</label>
                <input type="text" placeholder="e.g. Grocery shopping, Monthly salary…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Amount (₹)</label>
                  <input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} style={inputStyle} />
                </div>
              </div>

              {formError && <p style={{ color: "#f87171", fontSize: 12 }}>{formError}</p>}

              <button type="submit" style={{ padding: "12px 0", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.5)", transition: "all 0.2s", letterSpacing: 0.3 }}>
                ＋ Add Entry
              </button>
            </form>
          </div>

          {/* Entries List */}
          <div style={{ background: "rgba(15,23,42,0.7)", borderRadius: 20, border: "1px solid rgba(99,102,241,0.2)", backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ color: "#a5b4fc", fontSize: 15, fontWeight: 700, margin: 0 }}>📋 Entries</h2>
              <span style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>{entries.length}</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1, maxHeight: 420 }}>
              {entries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                  <p style={{ color: "#475569", fontSize: 14 }}>No entries yet. Add one to get started.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(30,41,59,0.8)" }}>
                      {["Date", "Description", "Category", "Amount", ""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: h === "Amount" ? "right" : "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, i) => (
                      <tr key={e.id} style={{ borderTop: "1px solid rgba(99,102,241,0.08)", background: i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.3)", transition: "background 0.15s" }}
                        onMouseEnter={ev => ev.currentTarget.style.background = "rgba(99,102,241,0.08)"}
                        onMouseLeave={ev => ev.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(30,41,59,0.3)"}
                      >
                        <td style={{ padding: "10px 14px", color: "#94a3b8", whiteSpace: "nowrap" }}>{e.date}</td>
                        <td style={{ padding: "10px 14px", color: "#e2e8f0", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: (CAT_COLORS[e.category] || "#94a3b8") + "28", color: CAT_COLORS[e.category] || "#94a3b8", border: `1px solid ${(CAT_COLORS[e.category] || "#94a3b8")}44` }}>
                            {e.category}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: e.type === "income" ? "#4ade80" : "#f87171" }}>
                          {e.type === "income" ? "+" : "−"}{fmt(e.amount)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <button onClick={() => handleDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 14, transition: "color 0.15s" }}
                            onMouseEnter={ev => ev.currentTarget.style.color = "#f87171"}
                            onMouseLeave={ev => ev.currentTarget.style.color = "#475569"}
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Chart Tabs ── */}
        <div style={{ background: "rgba(15,23,42,0.7)", borderRadius: 20, border: "1px solid rgba(99,102,241,0.2)", backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", overflow: "hidden" }}>

          {/* Tab Bar */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(99,102,241,0.15)", overflowX: "auto", background: "rgba(15,23,42,0.5)" }}>
            {[
              { id: "overview",   label: "📈 Overview",   desc: "Income vs Expenses" },
              { id: "breakdown",  label: "🥧 Breakdown",  desc: "By Category" },
              { id: "forecast",   label: "🔮 Forecast",   desc: "Next Month" },
              { id: "anomalies",  label: `⚠️ Anomalies${anomalies.length ? ` (${anomalies.length})` : ""}`, desc: "Unusual Spending" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "16px 24px",
                  background: activeTab === t.id ? "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))" : "transparent",
                  border: "none",
                  borderBottom: activeTab === t.id ? "2px solid #818cf8" : "2px solid transparent",
                  color: activeTab === t.id ? "#a5b4fc" : "#64748b",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <span>{t.label}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: activeTab === t.id ? "#818cf8" : "#475569" }}>{t.desc}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>
            {entries.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>📊</p>
                <p style={{ color: "#475569", fontSize: 15 }}>Add entries above to generate charts.</p>
              </div>
            )}

            {/* ── Overview ── */}
            {activeTab === "overview" && entries.length > 0 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Monthly Income vs Expenses</h3>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Area chart showing cash flow over time</p>
                </div>
                {byMonth.length === 0 ? (
                  <p style={{ color: "#475569", textAlign: "center", padding: "40px 0" }}>Not enough data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={byMonth} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4ade80" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#4ade80" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "rgba(99,102,241,0.2)" }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 13 }} />
                      <Area type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2.5} fill="url(#incGrad)" name="Income" dot={{ fill: "#4ade80", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#4ade80", stroke: "#fff", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2.5} fill="url(#expGrad)" name="Expenses" dot={{ fill: "#f87171", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#f87171", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* ── Breakdown ── */}
            {activeTab === "breakdown" && entries.length > 0 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Expenses by Category</h3>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Pie and bar breakdown of where your money goes</p>
                </div>
                {byCategory.length === 0 ? (
                  <p style={{ color: "#475569", textAlign: "center", padding: "40px 0" }}>No expense entries yet.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={byCategory} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" outerRadius={110} innerRadius={50}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: "rgba(148,163,184,0.4)" }}
                        >
                          {byCategory.map(entry => (
                            <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#94a3b8"} stroke="rgba(15,23,42,0.5)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                          {byCategory.map(entry => (
                            <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#94a3b8"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* ── Forecast ── */}
            {activeTab === "forecast" && entries.length > 0 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Expense Forecast</h3>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>3-month moving average projection — amber dot shows predicted next month</p>
                </div>
                {forecastData.length < 2 ? (
                  <p style={{ color: "#475569", textAlign: "center", padding: "40px 0" }}>Add entries across at least 2 months to see a forecast.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#fbbf24" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "rgba(99,102,241,0.2)" }} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone" dataKey="value" name="Expenses"
                          stroke="url(#lineGrad)" strokeWidth={3}
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            return payload.type === "forecast"
                              ? <circle key={payload.month} cx={cx} cy={cy} r={8} fill="#fbbf24" stroke="#fff" strokeWidth={2.5} style={{ filter: "drop-shadow(0 0 8px #fbbf24)" }} />
                              : <circle key={payload.month} cx={cx} cy={cy} r={5} fill="#818cf8" stroke="#fff" strokeWidth={2} />;
                          }}
                          activeDot={{ r: 7, fill: "#818cf8", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 20, padding: "16px 20px", background: "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 28 }}>🔮</span>
                      <div>
                        <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: 14, margin: "0 0 3px" }}>Next Month Prediction</p>
                        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                          Estimated expenses: <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{fmt(forecastData[forecastData.length - 1]?.value)}</span>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Anomalies ── */}
            {activeTab === "anomalies" && entries.length > 0 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Anomaly Detection</h3>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Expenses more than 2 standard deviations above your average are flagged</p>
                </div>
                {anomalies.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "50px 20px" }}>
                    <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
                    <p style={{ color: "#4ade80", fontSize: 15, fontWeight: 600 }}>No anomalies detected!</p>
                    <p style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>
                      {entries.filter(e => e.type === "expense").length < 3
                        ? "Add at least 3 expense entries to enable anomaly detection."
                        : "Your spending looks consistent and healthy."}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {anomalies.map(e => (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.06))", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚠️</div>
                          <div>
                            <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: 14, margin: "0 0 3px" }}>{e.description}</p>
                            <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{e.date} · <span style={{ color: CAT_COLORS[e.category] || "#94a3b8" }}>{e.category}</span></p>
                          </div>
                        </div>
                        <p style={{ color: "#f87171", fontWeight: 800, fontSize: 20, margin: 0, textShadow: "0 0 12px rgba(248,113,113,0.5)" }}>{fmt(e.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
