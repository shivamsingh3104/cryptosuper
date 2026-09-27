import { useEffect, useState } from "react";
import { API, headers } from "../../config/api";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-icon" style={{ background: color + "22" }}>{icon}</div>
      <div>
        <div className="adm-stat-val">{value}</div>
        <div className="adm-stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function StatsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/admin/stats`, { headers });
        const data = await res.json();
        setStats(data);
      } catch {
        setMsg("❌ Cannot connect to backend");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      {msg && <div className="adm-toast adm-toast-err">{msg}</div>}

      <h1 className="adm-page-title">Dashboard Statistics</h1>

      {loading ? <div className="tool-loading"><div className="spinner" /></div> : (
        <>
          <div className="adm-stats-grid">
            <StatCard icon="👥" label="Total Users" value={stats?.total ?? 0} color="#3b82f6" />
            <StatCard icon="✅" label="Active Users" value={stats?.active ?? 0} color="#22c55e" />
            <StatCard icon="🚫" label="Banned Users" value={stats?.banned ?? 0} color="#ef4444" />
            <StatCard icon="🔍" label="Google Logins" value={stats?.googleUsers ?? 0} color="#f59e0b" />
            <StatCard icon="✉️" label="Email/Pass Logins" value={stats?.emailUsers ?? 0} color="#8b5cf6" />
            <StatCard icon="🆕" label="New Today" value={stats?.newToday ?? 0} color="#06b6d4" />
            <StatCard icon="📅" label="New This Week" value={stats?.newWeek ?? 0} color="#10b981" />
          </div>

          <div className="adm-chart-card">
            <h3 className="adm-chart-title">Login Method Breakdown</h3>
            <div className="adm-method-bars">
              {[
                { label: "🔍 Google Login", count: stats?.googleUsers ?? 0, color: "#f59e0b" },
                { label: "✉️ Email / Password", count: stats?.emailUsers ?? 0, color: "#3b82f6" },
              ].map(m => {
                const pct = stats?.total > 0 ? Math.round((m.count / stats.total) * 100) : 0;
                return (
                  <div key={m.label} className="adm-method-bar-wrap">
                    <div className="adm-method-bar-label">
                      <span>{m.label}</span>
                      <span style={{ color: m.color, fontWeight: 700 }}>{m.count} users ({pct}%)</span>
                    </div>
                    <div className="adm-method-bar-track">
                      <div className="adm-method-bar-fill" style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}