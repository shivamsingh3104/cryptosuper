import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { saveUser } from "../services/userService";

function generateCaptcha() {
  const chars = "0123456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const PWD_RULES = [
  { label: "8+ characters", test: v => v.length >= 8 },
  { label: "Lowercase", test: v => /[a-z]/.test(v) },
  { label: "Capital", test: v => /[A-Z]/.test(v) },
  { label: "Number", test: v => /\d/.test(v) },
  { label: "Symbol", test: v => /[^a-zA-Z0-9]/.test(v) },
];

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [terms, setTerms] = useState(false);
  const [notRestricted, setNotRestricted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const captchaColors = ["#22c55e", "#3b82f6", "#22c55e", "#3b82f6", "#22c55e"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (captchaInput !== captcha) {
      setError("CAPTCHA is incorrect.");
      refreshCaptcha();
      return;
    }
    if (!terms) {
      setError("Please accept the Terms of Use and Privacy Policy.");
      return;
    }
    if (!notRestricted) {
      setError("Please confirm you are not from a restricted country.");
      return;
    }

    try {
      setLoading(true);

      // 1) Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2) Save user to Firestore
      await saveUser(firebaseUser, "email");

      navigate("/login");
    } catch (err) {
      setError(err?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError("");
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUser(result.user, "google");
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    try {
      setError("");
      setLoading(true);
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUser(result.user, "facebook");
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Facebook sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-signup">
      {/* Left promo panel */}
      <div className="signup-promo">
        <div className="signup-promo-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" fill="none" />
          </svg>
          New User Exclusive
        </div>

        <h1 className="signup-promo-title">
          Sign up and trade<br />to earn up to{" "}
          <span className="signup-promo-highlight">
            1,500<br />USDT
          </span>
        </h1>

        <div className="signup-illustration">
          <div className="si-coin">{/* SAME */}</div>
          <div className="si-user-dot">{/* SAME */}</div>
          <div className="si-diamond">◆</div>
          <div className="si-bar si-bar-1" />
          <div className="si-bar si-bar-2" />
          <div className="si-bar si-bar-3" />
          <div className="si-dot si-dot-blue" />
        </div>
      </div>

      {/* Right form card */}
      <div className="auth-card auth-card-signup">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-sub">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Log In</Link>
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email */}
          <div className="auth-field">
            <svg className="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <svg className="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          {/* Password strength */}
          <div className="pwd-rules">
            {PWD_RULES.map(r => (
              <span key={r.label} className={`pwd-rule${r.test(password) ? " ok" : ""}`}>
                {r.label}
              </span>
            ))}
          </div>

          {/* CAPTCHA (UNCHANGED) */}
          <div className="auth-captcha-wrap" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="CAPTCHA"
              value={captchaInput}
              onChange={e => setCaptchaInput(e.target.value)}
              className="auth-input auth-captcha-input"
              maxLength={5}
            />
            <div className="auth-captcha-display" onClick={refreshCaptcha}>
              {captcha.split("").map((ch, i) => (
                <span
                  key={i}
                  style={{
                    color: captchaColors[i % captchaColors.length],
                    fontStyle: i % 2 === 0 ? "italic" : "normal",
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <label className="auth-check">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
            <span>
              I accept the <a href="#" className="auth-link">Terms</a>
            </span>
          </label>

          <label className="auth-check">
            <input
              type="checkbox"
              checked={notRestricted}
              onChange={e => setNotRestricted(e.target.checked)}
            />
            <span>
              I confirm I am not from a restricted country
            </span>
          </label>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Sending verification..." : "Continue"}
          </button>

          {/* 👇 SOCIAL BELOW CONTINUE */}
          <div style={{ height: 12 }} />

          <button type="button" className="auth-btn" onClick={handleGoogleAuth}>
            Continue with Google
          </button>

          <div style={{ height: 10 }} />

          <button type="button" className="auth-btn" onClick={handleFacebookAuth}>
            Continue with Facebook
          </button>
        </form>
      </div>
    </div>
  );
}