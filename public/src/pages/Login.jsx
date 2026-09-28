import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // ✅ ADD
import { saveUser } from "../services/userService"; // ✅ ADD
import { authErrorMessage } from "../utils/authErrors";

function generateCaptcha() {
  const chars = "0123456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function Login() {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captcha,      setCaptcha]      = useState(generateCaptcha);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || "/";

  const refreshCaptcha = () => { setCaptcha(generateCaptcha()); setCaptchaInput(""); };
  const captchaColors  = ["#22c55e","#3b82f6","#22c55e","#3b82f6","#22c55e"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (captchaInput !== captcha) {
      setError("CAPTCHA is incorrect.");
      refreshCaptcha();
      return;
    }

    try {
      setLoading(true);

      // 🔥 FIREBASE LOGIN
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 🔥 SAVE USER (Firestore)
      await saveUser(firebaseUser, "email");

      setLoading(false);
      navigate(from, { replace: true });

    } catch (err) {
      // Raw "Firebase: Error (auth/invalid-credential)." user ko kuch nahi
      // batata. Ab code ke basis par clear message.
      console.error("login failed:", err?.code, err?.message);
      setError(authErrorMessage(err));
      setLoading(false);
      refreshCaptcha();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-url-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>https://kepwix.com</span>
        </div>

        <h2 className="auth-title">Log In</h2>
        <p className="auth-sub">
          Don't have an account yet?{" "}
          <Link to="/signup" className="auth-link">Create Account</Link>
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          {/* Email */}
          <div className="auth-field">
            <svg className="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 7l10 7 10-7"/>
            </svg>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <svg className="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPass(p => !p)}
              tabIndex={-1}
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                </svg>
              )}
            </button>
          </div>

          <div className="auth-forgot-row">
            <Link to="#" className="auth-link auth-forgot">Forgot Password?</Link>
          </div>

          {/* CAPTCHA */}
          <div className="auth-captcha-wrap">
            <input
              type="text"
              placeholder="Enter CAPTCHA"
              value={captchaInput}
              onChange={e => setCaptchaInput(e.target.value)}
              className="auth-input auth-captcha-input"
              maxLength={5}
            />
            <div className="auth-captcha-display" onClick={refreshCaptcha}>
              {captcha.split("").map((ch, i) => (
                <span key={i} style={{ color: captchaColors[i % captchaColors.length] }}>
                  {ch}
                </span>
              ))}
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Continue"}
          </button>

        </form>

        <details className="auth-restricted">
          <summary>Access restricted for residents of these countries</summary>
          <p>United States, Canada, China, North Korea, Iran, Syria, Cuba, Russia, and others based on regulatory requirements.</p>
        </details>

      </div>
    </div>
  );
}