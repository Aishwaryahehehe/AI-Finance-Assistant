import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=80",
    title: "Take Control of Your Finances",
    subtitle: "AI-powered insights to help you save more, spend smarter, and reach your goals faster.",
    cta: "Get Started Free",
    ctaLink: "/signup",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1600&q=80",
    title: "Smart Budget Tracking",
    subtitle: "Set budgets, track spending in real-time, and get alerts before you overspend.",
    cta: "View Dashboard",
    ctaLink: "/dashboard",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=1600&q=80",
    title: "AI Financial Analysis",
    subtitle: "Detect anomalies, forecast expenses, and get personalized advice powered by machine learning.",
    cta: "Explore Analysis",
    ctaLink: "/analysis",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1600&q=80",
    title: "Achieve Your Savings Goals",
    subtitle: "Set financial goals and watch your progress grow with intelligent tracking.",
    cta: "Set a Goal",
    ctaLink: "/goals",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1600&q=80",
    title: "Your Personal Finance Chatbot",
    subtitle: "Ask anything about your money. Get instant, personalized financial advice 24/7.",
    cta: "Chat Now",
    ctaLink: "/chatbot",
  },
];

const features = [
  {
    icon: "📊",
    title: "Real-Time Dashboard",
    desc: "Monitor income, expenses, and balance at a glance with beautiful interactive charts.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    desc: "Machine learning detects unusual spending and forecasts your next month's expenses.",
  },
  {
    icon: "🎯",
    title: "Goal Tracking",
    desc: "Set savings goals and track your progress with visual milestones.",
  },
  {
    icon: "🔔",
    title: "Budget Alerts",
    desc: "Get notified before you exceed your budget limits in any category.",
  },
  {
    icon: "💬",
    title: "Finance Chatbot",
    desc: "Ask your AI assistant anything about your finances and get instant advice.",
  },
  {
    icon: "🔒",
    title: "Bank-Level Security",
    desc: "Your data is encrypted and protected with JWT authentication.",
  },
];

const mockFeedbacks = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Freelance Designer",
    avatar: "SJ",
    rating: 5,
    comment:
      "FinanceAI completely changed how I manage my money. The AI chatbot gave me advice I never thought of. I saved ₹65,000 in just two months!",
    date: "April 2026",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "Software Engineer",
    avatar: "MC",
    rating: 5,
    comment:
      "The expense forecasting is incredibly accurate. It predicted my overspending before it happened. The anomaly detection is a game changer.",
    date: "March 2026",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: 3,
    name: "Priya Patel",
    role: "Small Business Owner",
    avatar: "PP",
    rating: 5,
    comment:
      "I use this for both personal and business finances. The budget tracking and goal features are exactly what I needed. Highly recommend!",
    date: "March 2026",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: 4,
    name: "James Williams",
    role: "College Student",
    avatar: "JW",
    rating: 4,
    comment:
      "As a student on a tight budget, this app is a lifesaver. The alerts stop me from overspending and the chatbot helps me plan better.",
    date: "February 2026",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 5,
    name: "Elena Rodriguez",
    role: "Marketing Manager",
    avatar: "ER",
    rating: 5,
    comment:
      "Beautiful UI, powerful features. The financial analysis page is like having a personal CFO. I love the spending breakdown charts.",
    date: "February 2026",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: 6,
    name: "David Kim",
    role: "Entrepreneur",
    avatar: "DK",
    rating: 5,
    comment:
      "The AI insights are spot on. It flagged a subscription I forgot about and helped me cut ₹16,000/month in unnecessary expenses.",
    date: "January 2026",
    color: "from-teal-500 to-emerald-500",
  },
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "₹20Cr+", label: "Money Saved" },
  { value: "98%", label: "Accuracy Rate" },
  { value: "24/7", label: "AI Support" },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Hero Slideshow ── */}
      <section className="relative h-screen overflow-hidden">
        {/* Background image */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        {/* Slide content */}
        <div
          className={`relative z-10 flex h-full items-center transition-all duration-700 ${
            isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered Finance Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
                {slide.title.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className={i % 3 === 2 ? "bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" : ""}
                  >
                    {word}{" "}
                  </span>
                ))}
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={slide.ctaLink}
                  className="px-8 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                >
                  {slide.cta}
                </Link>
                <Link
                  to="/dashboard"
                  className="px-8 py-3 rounded-xl font-bold text-slate-100 border border-slate-600 hover:border-slate-400 hover:bg-slate-800/50 transition-all backdrop-blur-sm"
                >
                  Live Demo
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? "w-8 h-2 bg-emerald-400"
                  : "w-2 h-2 bg-slate-500 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-8 right-8 z-20 text-sm text-slate-400 font-mono">
          {String(currentSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-8 z-20 flex flex-col items-center gap-2 text-slate-400">
          <span className="text-xs tracking-widest uppercase rotate-90 origin-center translate-y-4">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Everything You Need
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Smart Finance
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              From AI-powered insights to real-time budget tracking — everything you need to master your money.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-900/40 via-slate-900 to-cyan-900/40 border border-emerald-500/20 p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Ready to Transform Your{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Financial Life?
                </span>
              </h2>
              <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                Join thousands of users who are already saving more and spending smarter with FinanceAI.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/signup"
                  className="px-8 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-xl shadow-emerald-500/30"
                >
                  Start for Free
                </Link>
                <Link
                  to="/analysis"
                  className="px-8 py-3 rounded-xl font-bold text-slate-100 border border-slate-600 hover:border-emerald-500/50 transition-all"
                >
                  See Analysis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── User Feedbacks ── */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              What Our Users{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Are Saying
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Real stories from real people who transformed their financial habits with FinanceAI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/50 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < fb.rating ? "text-amber-400" : "text-slate-700"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Comment */}
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                  "{fb.comment}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${fb.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                  >
                    {fb.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-100">{fb.name}</p>
                    <p className="text-xs text-slate-500">{fb.role} · {fb.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leave feedback CTA */}
          <div className="text-center mt-12">
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
            >
              Share Your Experience
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <span className="text-slate-950 font-black text-xs">₿</span>
              </div>
              <span className="font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                FinanceAI
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 FinanceAI. Built with AI for smarter financial decisions.
            </p>
            <div className="flex gap-4 text-sm text-slate-500">
              <Link to="/feedback" className="hover:text-slate-300 transition-colors">Feedback</Link>
              <Link to="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
              <Link to="/chatbot" className="hover:text-slate-300 transition-colors">Chatbot</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
