import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const SUGGESTION_CATEGORIES = [
  {
    label: "💰 Saving",
    items: ["How do I save money?", "Tips to cut monthly expenses", "How to build an emergency fund?"],
  },
  {
    label: "📊 Budgeting",
    items: ["How do I create a budget?", "What is the 50/30/20 rule?", "Where am I spending the most?"],
  },
  {
    label: "💳 Debt & Credit",
    items: ["How do I pay off debt faster?", "How to improve my credit score?", "Avalanche vs snowball method?"],
  },
  {
    label: "📈 Investing",
    items: ["How do I start investing?", "Should I invest or pay off debt?", "What are index funds?"],
  },
  {
    label: "🛒 Affordability",
    items: ["Can I afford $500 this month?", "Can I afford $200?", "Is $1000 a big purchase?"],
  },
  {
    label: "🎯 Goals",
    items: ["How do I set financial goals?", "How to save for a vacation?", "How to save for a house?"],
  },
];

// Render markdown-like bold (**text**) and line breaks
function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part.split("\n").map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ));
      })}
    </span>
  );
}

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hey there! 👋 I'm your **AI Finance Assistant**.\n\nI can help you with budgeting, saving, debt, investing, and more. What's on your mind today?",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export default function Chatbot() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addAssistantMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time }]);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: trimmed }),
      });

      if (res.status === 401) {
        addAssistantMessage("🔐 Please **log in** to get personalized advice based on your actual financial data.\n\nYou can still ask general finance questions without logging in!");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const reply = data.advice || data.message || "I couldn't generate advice right now. Try rephrasing your question!";
      addAssistantMessage(reply);
    } catch {
      addAssistantMessage("⚠️ I'm having trouble connecting right now. Please check your connection and try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-16 flex flex-col">
      <div className="flex flex-col lg:flex-row flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 gap-6 py-6">

        {/* ── Left sidebar: suggestions ── */}
        <aside className="lg:w-72 flex-shrink-0 space-y-4">
          {/* Status card */}
          <div className={`rounded-2xl border p-4 ${isLoggedIn ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isLoggedIn ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className={`text-xs font-semibold ${isLoggedIn ? "text-emerald-400" : "text-amber-400"}`}>
                {isLoggedIn ? "Personalized Mode" : "General Mode"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isLoggedIn
                ? "Advice is tailored to your actual transactions and balance."
                : <>Not logged in. <Link to="/login" className="text-emerald-400 underline">Sign in</Link> for personalized advice.</>}
            </p>
          </div>

          {/* Suggestion categories */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Questions</p>
            </div>

            {/* Category tabs */}
            <div className="flex overflow-x-auto gap-1 p-2 border-b border-slate-800 scrollbar-hide">
              {SUGGESTION_CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCat(i)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeCat === i
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Suggestion items */}
            <div className="p-2 space-y-1">
              {SUGGESTION_CATEGORIES[activeCat].items.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 group"
                >
                  <svg className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tips card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">💡 Pro Tips</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span>Ask specific amounts: "Can I afford $300?"</li>
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span>Ask about categories: "How to cut food costs?"</li>
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span>Log in for advice based on your real data</li>
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span>Add transactions to unlock spending insights</li>
            </ul>
          </div>
        </aside>

        {/* ── Main chat area ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm">🤖</span>
                Finance Assistant
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Powered by AI · Always available</p>
            </div>
            <button
              onClick={clearChat}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col overflow-hidden" style={{ minHeight: "480px" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ maxHeight: "calc(100vh - 320px)", minHeight: "380px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                      : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                  }`}>
                    {msg.role === "user" ? "You" : "AI"}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-cyan-600/25 to-blue-600/25 border border-cyan-500/20 text-slate-100 rounded-tr-sm"
                        : "bg-slate-800/70 border border-slate-700/40 text-slate-100 rounded-tl-sm"
                    }`}>
                      <MessageText text={msg.text} />
                    </div>
                    <span className="text-xs text-slate-600 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg">
                    AI
                  </div>
                  <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3.5">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "160ms" }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "320ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/60">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Ask me anything about your finances..."
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 pr-12 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-60"
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-11 h-11 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              <p className="text-xs text-slate-600 mt-2 text-center">
                Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 text-xs">Enter</kbd> to send · General financial education only, not professional advice
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
