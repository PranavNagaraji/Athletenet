import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, User, PersonStanding, Shield, Building2, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { VALIDATION_LIMITS, isStrongPassword, isValidEmail, normalizeText } from "../utils/formValidation";
import "./AuthPage.css";

export default function AuthPage({ defaultMode = "login" }) {
  const [mode, setMode] = useState(defaultMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("athlete");

  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const switchMode = (newMode) => {
    setError("");
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.target);
    const password = fd.get("password");
    const confirmPassword = fd.get("confirmPassword");
    const payload = {
      email: normalizeText(fd.get("email")),
      password,
    };

    if (mode === "signup") {
      payload.name = normalizeText(fd.get("name"));
      payload.role = fd.get("role") || role;
    }

    if (!isValidEmail(payload.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!isStrongPassword(payload.password)) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && payload.name.length < VALIDATION_LIMITS.nameMin) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

    try {
      const res = await fetch(`${backend_url}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (res.ok) {
        const ok = await checkAuth();
        if (ok) navigate("/home", { replace: true });
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className={`auth-root ${isLogin ? "mode-login" : "mode-signup"}`}>
      <div className="auth-theme-toggle animate-slide-right stagger-4">
        <ThemeToggle />
      </div>

      <div className="auth-form-panel auth-login-panel">
        <div className="form-inner">
          <div className="form-header animate-slide-up stagger-1">
            <div className="form-logo"><Zap size={40} strokeWidth={2.5} /></div>
            <h1 className="form-title">Sign In</h1>
            <p className="form-subtitle">Welcome back, champion</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
            <div className="input-group animate-slide-up stagger-2">
              <span className="input-icon"><Mail size={18} /></span>
              <input type="email" name="email" placeholder="Email address" required autoComplete="email" maxLength={120} />
            </div>
            <div className="input-group animate-slide-up stagger-3">
              <span className="input-icon"><Lock size={18} /></span>
              <input type="password" name="password" placeholder="Password" required autoComplete="current-password" minLength={8} maxLength={128} />
            </div>
            {error && <div className="auth-error animate-slide-up">{error}</div>}
            <button type="submit" className="auth-submit-btn animate-slide-up stagger-4" disabled={loading}>
              {loading ? <Loader2 size={24} className="spinner-icon" /> : "Sign In"}
            </button>
          </form>

          <p className="form-switch-mobile animate-slide-up stagger-4">
            No account?{" "}
            <button onClick={() => switchMode("signup")}>Sign Up</button>
          </p>
        </div>
      </div>

      <div className="auth-form-panel auth-signup-panel">
        <div className="form-inner">
          <div className="form-header animate-slide-up stagger-1">
            <div className="form-logo"><Zap size={40} strokeWidth={2.5} /></div>
            <h1 className="form-title">Join Us</h1>
            <p className="form-subtitle">Create your Athletenet account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
            <div className="input-group animate-slide-up stagger-1">
              <span className="input-icon"><User size={18} /></span>
              <input type="text" name="name" placeholder="Full name" required autoComplete="name" minLength={VALIDATION_LIMITS.nameMin} maxLength={VALIDATION_LIMITS.nameMax} />
            </div>
            <div className="input-group animate-slide-up stagger-2">
              <span className="input-icon"><Mail size={18} /></span>
              <input type="email" name="email" placeholder="Email address" required autoComplete="email" maxLength={120} />
            </div>
            <div className="input-group animate-slide-up stagger-2">
              <span className="input-icon"><Lock size={18} /></span>
              <input type="password" name="password" placeholder="Password" required autoComplete="new-password" minLength={8} maxLength={128} />
            </div>
            <div className="input-group animate-slide-up stagger-3">
              <span className="input-icon"><Lock size={18} /></span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
              />
            </div>

            <div className="role-picker animate-slide-up stagger-4">
              {[
                { value: "athlete", icon: <PersonStanding size={24} />, label: "Athlete" },
                { value: "coach", icon: <Shield size={24} />, label: "Coach" },
                { value: "club", icon: <Building2 size={24} />, label: "Club" },
              ].map((r) => (
                <label key={r.value} className={`role-card ${role === r.value ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                  />
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-label">{r.label}</span>
                </label>
              ))}
            </div>

            {error && <div className="auth-error animate-slide-up">{error}</div>}
            <button type="submit" className="auth-submit-btn animate-slide-up stagger-4" disabled={loading}>
              {loading ? <Loader2 size={24} className="spinner-icon" /> : "Create Account"}
            </button>
          </form>

          <p className="form-switch-mobile animate-slide-up stagger-4">
            Have an account?{" "}
            <button onClick={() => switchMode("login")}>Sign In</button>
          </p>
        </div>
      </div>

      <div className="auth-overlay-panel">
        <div className="overlay-inner">
          <div className="overlay-left">
            <div className="overlay-content animate-scale-in">
              <div className="brand-badge">ATHLETENET</div>
              <h2 className="overlay-title">Welcome Back, Champion</h2>
              <p className="overlay-sub">
                Log in to reconnect with your club, track your training and stay ahead of the competition.
              </p>
              <button className="overlay-btn" onClick={() => switchMode("login")}>
                Sign In
              </button>
            </div>
          </div>

          <div className="overlay-right">
            <div className="overlay-content animate-scale-in">
              <div className="brand-badge">ATHLETENET</div>
              <h2 className="overlay-title">Your Arena Awaits</h2>
              <p className="overlay-sub">
                Join thousands of athletes, coaches and clubs. Build your legacy one session at a time.
              </p>
              <button className="overlay-btn" onClick={() => switchMode("signup")}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
