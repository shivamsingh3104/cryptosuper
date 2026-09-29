import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";
import authedFetch from "../utils/authedFetch";

export default function UserDashboard() {
  const { user, isLoggedIn, logout, getProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("profile");
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ name: "", phone: "", country: "" });
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");
  const [swapHistory, setSwapHistory] = useState([]);
  const [walletList, setWalletList] = useState([]);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login", { state: { from: "/dashboard" } }); return; }
    (async () => {
      const p = await getProfile();
      if (p) { setProfile(p); setForm({ name: p.name || "", phone: p.phone || "", country: p.country || "" }); }
      setLoading(false);
    })();
    authedFetch(`/api/swap/user/${user?.uid}`)
      .then(r => r.json()).then(d => setSwapHistory(d || [])).catch(() => {});
    fetch(`${API}/api/wallets`)
      .then(r => r.json()).then(d => setWalletList(d || [])).catch(() => {});
    authedFetch(`/api/users/balance`)
      .then(r => r.json()).then(d => setUserBalance(d.balance || 0)).catch(() => {});
  }, [isLoggedIn]);

  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    const updated = await updateProfile(form);
    if (updated) { setProfile(updated); setSaveMsg("✅ Profile updated!"); setEditing(false); }
    else         setSaveMsg("❌ Failed to save. Is backend running?");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  if (!isLoggedIn || loading) return (
    <div style={{ minHeight:"calc(100vh - 56px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="spinner" />
    </div>
  );

  const initials = (user?.name || "U").slice(0, 2).toUpperCase();
  const methodIcon = user?.loginMethod === "google"
    ? <span className="ud-badge ud-badge-google">🔍 Google</span>
    : <span className="ud-badge ud-badge-email">✉️ Email</span>;

  return (
    <div className="ud-page">
      {/* Sidebar */}
      <aside className="ud-sidebar">
        <div className="ud-sidebar-user">
          {user?.photo
            ? <img src={user.photo} width={52} height={52} className="ud-avatar-img" alt="avatar" />
            : <div className="ud-avatar-initials">{initials}</div>
          }
          <div>
            <div className="ud-sidebar-name">{user?.name}</div>
            <div className="ud-sidebar-email">{user?.email}</div>
            <div style={{ marginTop: 6 }}>{methodIcon}</div>
          </div>
        </div>

        <nav className="ud-sidenav">
          {[
            { id:"profile",  label:"My Profile",   icon:"👤" },
            { id:"security", label:"Security",      icon:"🔐" },
            { id:"activity", label:"Login Activity",icon:"📊" },
            { id:"swaps",    label:"Swap History",  icon:"🔄" },
            { id:"wallets",  label:"Wallets",       icon:"💰" },
          ].map(item => (
            <button key={item.id} className={`ud-nav-btn${tab === item.id ? " active" : ""}`}
              onClick={() => setTab(item.id)}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <button className="ud-logout-btn" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="ud-main">

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div className="ud-card">
            <div className="ud-card-header">
              <h2>My Profile</h2>
              {!editing && (
                <button className="ud-edit-btn" onClick={() => setEditing(true)}>✏️ Edit</button>
              )}
            </div>
            <div style={{ background: "#eff6ff", padding: "1rem 1.2rem", borderRadius: "0.75rem", marginBottom: "1.5rem", border: "1px solid #bfdbfe" }}>
              <span style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wallet Balance</span>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e3a5f" }}>${userBalance.toFixed(2)} USD</div>
            </div>

            {saveMsg && <div className={`ud-msg ${saveMsg.startsWith("✅") ? "ud-msg-ok" : "ud-msg-err"}`}>{saveMsg}</div>}

            <div className="ud-profile-grid">
              <div className="ud-field-group">
                <label>Full Name</label>
                {editing
                  ? <input className="ud-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  : <div className="ud-field-val">{profile?.name || "—"}</div>
                }
              </div>
              <div className="ud-field-group">
                <label>Email Address</label>
                <div className="ud-field-val ud-readonly">{user?.email}</div>
              </div>
              <div className="ud-field-group">
                <label>Phone Number</label>
                {editing
                  ? <input className="ud-input" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  : <div className="ud-field-val">{profile?.phone || "—"}</div>
                }
              </div>
              <div className="ud-field-group">
                <label>Country</label>
                {editing
                  ? <input className="ud-input" placeholder="India" value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} />
                  : <div className="ud-field-val">{profile?.country || "—"}</div>
                }
              </div>
              <div className="ud-field-group">
                <label>Login Method</label>
                <div className="ud-field-val">{methodIcon}</div>
              </div>
              <div className="ud-field-group">
                <label>Member Since</label>
                <div className="ud-field-val">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" }) : "—"}
                </div>
              </div>
            </div>

            {editing && (
              <div className="ud-action-row">
                <button className="ud-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button className="ud-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {tab === "security" && (
          <div className="ud-card">
            <div className="ud-card-header"><h2>Security</h2></div>
            <div className="ud-security-list">
              <div className="ud-security-item">
                <div>
                  <div className="ud-security-title">Login Method</div>
                  <div className="ud-security-desc">
                    {user?.loginMethod === "google"
                      ? "Your account is linked to Google. Password login is not available."
                      : "You are using email & password authentication."
                    }
                  </div>
                </div>
                <div>{methodIcon}</div>
              </div>
              <div className="ud-security-item">
                <div>
                  <div className="ud-security-title">Two-Factor Authentication</div>
                  <div className="ud-security-desc">Add extra security to your account</div>
                </div>
                <button className="ud-enable-btn">Enable 2FA</button>
              </div>
              <div className="ud-security-item">
                <div>
                  <div className="ud-security-title">Anti-Phishing Code</div>
                  <div className="ud-security-desc">Set a code to verify account emails</div>
                </div>
                <button className="ud-enable-btn">Set Code</button>
              </div>
              <div className="ud-security-item">
                <div>
                  <div className="ud-security-title">Total Logins</div>
                  <div className="ud-security-desc">How many times you've logged in</div>
                </div>
                <span className="ud-stat-num">{profile?.loginCount || 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SWAP HISTORY TAB ── */}
        {tab === "swaps" && (
          <div className="ud-card">
            <div className="ud-card-header"><h2>Swap History</h2></div>
            {swapHistory.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>No swaps yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>From</th>
                      <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>To</th>
                      <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Amount</th>
                      <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Hash Key</th>
                      <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swapHistory.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.6rem", fontWeight: 600 }}>{s.fromCurrency}</td>
                        <td style={{ padding: "0.6rem", fontWeight: 600 }}>{s.toCurrency}</td>
                        <td style={{ padding: "0.6rem" }}>{s.fromAmount} → {s.toAmount}</td>
                        <td style={{ padding: "0.6rem" }}><code style={{ fontSize: "0.65rem", background: "#f1f5f9", padding: "0.15rem 0.3rem", borderRadius: "0.25rem", wordBreak: "break-all" }}>{s.hashKey}</code></td>
                        <td style={{ padding: "0.6rem" }}><span className={`badge-${s.status}`} style={{ padding: "0.15rem 0.5rem", borderRadius: "1rem", fontSize: "0.7rem", fontWeight: 700, background: s.status === "pending" ? "#fef3c7" : s.status === "processed" ? "#dbeafe" : "#d1fae5", color: s.status === "pending" ? "#92400e" : s.status === "processed" ? "#1e40af" : "#065f46" }}>{s.status}</span></td>
                        <td style={{ padding: "0.6rem", color: "#64748b", fontSize: "0.8rem" }}>{s.createdAt ? new Date(s.createdAt.seconds * 1000 || s.createdAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── WALLETS TAB ── */}
        {tab === "wallets" && (
          <div className="ud-card">
            <div className="ud-card-header"><h2>Official Wallets</h2></div>
            {walletList.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>No wallets available.</div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {walletList.map(w => (
                  <div key={w.id} style={{ padding: "1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <strong style={{ color: "#2563eb" }}>{w.walletName}</strong>
                      {w.hashKey && <code style={{ fontSize: "0.7rem", background: "#fef3c7", padding: "0.2rem 0.4rem", borderRadius: "0.3rem", color: "#92400e" }}>Hash: {w.hashKey}</code>}
                    </div>
                    <code style={{ fontSize: "0.8rem", wordBreak: "break-all", background: "#f1f5f9", padding: "0.3rem 0.5rem", borderRadius: "0.3rem", display: "block" }}>{w.walletAddress}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === "activity" && (
          <div className="ud-card">
            <div className="ud-card-header"><h2>Login Activity</h2></div>
            <div className="ud-activity-list">
              <div className="ud-activity-item">
                <div className="ud-activity-icon">🟢</div>
                <div>
                  <div className="ud-activity-title">Last Login</div>
                  <div className="ud-activity-time">
                    {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString("en-IN") : "—"}
                  </div>
                </div>
                <div className="ud-activity-method">{methodIcon}</div>
              </div>
              <div className="ud-activity-item">
                <div className="ud-activity-icon">📅</div>
                <div>
                  <div className="ud-activity-title">Account Created</div>
                  <div className="ud-activity-time">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleString("en-IN") : "—"}
                  </div>
                </div>
                <span className="ud-activity-count">{profile?.loginCount || 1} logins total</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
