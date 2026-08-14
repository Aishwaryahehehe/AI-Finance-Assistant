import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Transactions", to: "/transactions" },
  { label: "Budgets", to: "/budgets" },
  { label: "Goals", to: "/goals" },
  { label: "Financial Analysis", to: "/analysis" },
  { label: "AI Chatbot", to: "/chatbot" },
  { label: "Feedback", to: "/feedback" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-slate-950 font-black text-sm">₿</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              FinanceAI
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {token ? (
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 flex gap-2 border-t border-slate-800">
            {token ? (
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg text-sm font-semibold text-slate-300 border border-slate-700"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950"
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
