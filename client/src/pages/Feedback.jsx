import { useState } from "react";

const existingFeedbacks = [
  { id: 1, name: "Sarah Johnson", role: "Freelance Designer", avatar: "SJ", rating: 5, comment: "FinanceAI completely changed how I manage my money. The AI chatbot gave me advice I never thought of. I saved ₹65,000 in just two months!", date: "April 2026", color: "from-emerald-500 to-teal-500" },
  { id: 2, name: "Marcus Chen", role: "Software Engineer", avatar: "MC", rating: 5, comment: "The expense forecasting is incredibly accurate. It predicted my overspending before it happened. The anomaly detection is a game changer.", date: "March 2026", color: "from-cyan-500 to-blue-500" },
  { id: 3, name: "Priya Patel", role: "Small Business Owner", avatar: "PP", rating: 5, comment: "I use this for both personal and business finances. The budget tracking and goal features are exactly what I needed. Highly recommend!", date: "March 2026", color: "from-violet-500 to-purple-500" },
  { id: 4, name: "James Williams", role: "College Student", avatar: "JW", rating: 4, comment: "As a student on a tight budget, this app is a lifesaver. The alerts stop me from overspending and the chatbot helps me plan better.", date: "February 2026", color: "from-amber-500 to-orange-500" },
];

export default function Feedback() {
  const [form, setForm] = useState({ name: "", role: "", rating: 5, comment: "" });
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState(existingFeedbacks);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) return;

    const initials = form.name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["from-emerald-500 to-teal-500", "from-cyan-500 to-blue-500", "from-violet-500 to-purple-500", "from-rose-500 to-pink-500"];
    const newFeedback = {
      id: Date.now(),
      name: form.name.trim(),
      role: form.role.trim() || "FinanceAI User",
      avatar: initials,
      rating: form.rating,
      comment: form.comment.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);
    setSubmitted(true);
    setForm({ name: "", role: "", rating: 5, comment: "" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">Community</p>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            Share Your{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Experience
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Your feedback helps us improve and inspires others to take control of their finances.
          </p>
        </div>

        {/* Submit Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 mb-12">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Thank you for your feedback!</h3>
              <p className="text-slate-400 mb-6">Your review has been added to the community.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 rounded-xl text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
              >
                Write Another Review
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-6">Leave a Review</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Role</label>
                    <input
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      placeholder="e.g. Student, Engineer..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, rating: star }))}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoveredStar || form.rating) ? "text-amber-400" : "text-slate-700"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-400 self-center">
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][hoveredStar || form.rating]}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Review *</label>
                  <textarea
                    required
                    rows={4}
                    value={form.comment}
                    onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Tell us about your experience with FinanceAI..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Submit Review
                </button>
              </form>
            </>
          )}
        </div>

        {/* All Feedbacks */}
        <div>
          <h2 className="text-xl font-bold mb-6">
            Community Reviews{" "}
            <span className="text-sm font-normal text-slate-400">({feedbacks.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-600 transition-all"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < fb.rating ? "text-amber-400" : "text-slate-700"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{fb.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${fb.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {fb.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{fb.name}</p>
                    <p className="text-xs text-slate-500">{fb.role} · {fb.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
