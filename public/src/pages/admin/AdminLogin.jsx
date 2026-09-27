import { useState, useEffect } from "react";
import { API } from "../../config/api";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ FIX: company state yaha hona chahiye
  const [company, setCompany] = useState(null);

  // ✅ FETCH COMPANY
  useEffect(() => {
    fetch(`${API}/api/company`)
      .then(res => res.json())
      .then(data => setCompany(data))
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminAuth", "true");
        onLogin();
      } else {
        setError(data.message || "Invalid credentials");
        setLoading(false);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };;

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-logo">

          {/* ✅ DYNAMIC LOGO */}
          {company?.logo?.light ? (
            <img src={company.logo.light} style={{ height: 40 }} />
          ) : (
            <div className="navbar-logo-box" style={{ width: 40, height: 40 }}>✕</div>
          )}

          {/* ✅ DYNAMIC NAME */}
          <span className="navbar-logo-text" style={{ fontSize: 20 }}>
            {company?.name || "Super App"}
          </span>

        </div>

        <h2 className="adm-login-title">Admin Panel</h2>
        <p className="adm-login-sub">Sign in to manage users</p>

        {error && <div className="adm-error">{error}</div>}

        <form onSubmit={handleLogin} className="adm-login-form">
          <div className="adm-field">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={ADMIN_EMAIL}
              className="adm-input"
              autoFocus
            />
          </div>

          <div className="adm-field">
            <label>Password</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              className="adm-input"
            />
          </div>

          <button type="submit" className="adm-login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}