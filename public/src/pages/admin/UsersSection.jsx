import { useCallback, useEffect, useState } from "react";
import { API, headers } from "../../config/api";

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [selUser, setSelUser] = useState(null);

  const showMsg = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      showMsg("❌ Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatus = async (uid, status) => {
    try {
      await fetch(`${API}/api/admin/users/${uid}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status } : u));
      showMsg(`✅ User ${status === "banned" ? "banned" : "activated"}`);
      setSelUser(null);
    } catch {
      showMsg("❌ Action failed");
    }
  };

  const handleDelete = async (uid) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await fetch(`${API}/api/admin/users/${uid}`, { method: "DELETE", headers });
      setUsers(prev => prev.filter(u => u.uid !== uid));
      showMsg("✅ User deleted");
      setSelUser(null);
    } catch {
      showMsg("❌ Delete failed");
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "google" ? u.loginMethod === "google" :
      filter === "email" ? u.loginMethod === "email" :
      filter === "active" ? u.status === "active" :
      filter === "banned" ? u.status === "banned" : true;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {msg && <div className={`adm-toast ${msg.startsWith("✅") ? "adm-toast-ok" : "adm-toast-err"}`}>{msg}</div>}

      <div className="adm-users-header">
        <h1 className="adm-page-title">All Users</h1>
        <button className="adm-refresh-btn" onClick={fetchUsers}>↻ Refresh</button>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="adm-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="adm-filter-btns">
          {[
            { id: "all", label: "All" },
            { id: "google", label: "🔍 Google" },
            { id: "email", label: "✉️ Email" },
            { id: "active", label: "✅ Active" },
            { id: "banned", label: "🚫 Banned" },
          ].map(f => (
            <button
              key={f.id}
              className={`adm-filter-btn${filter === f.id ? " active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-count-row">
        Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
      </div>

      {loading ? (
        <div className="tool-loading"><div className="spinner" /></div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Login Method</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Logins</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="adm-empty">No users found</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.uid} className="adm-tr">
                  <td className="adm-td adm-td-num">{i + 1}</td>

                  <td className="adm-td adm-td-user">
                    {u.photo
                      ? <img src={u.photo} width={32} height={32} className="adm-user-img" alt={u.name} />
                      : <div className="adm-user-initials">{(u.name || "U").slice(0, 2).toUpperCase()}</div>
                    }
                    <span className="adm-user-name">{u.name || "—"}</span>
                  </td>

                  <td className="adm-td adm-td-email">{u.email}</td>

                  <td className="adm-td">
                    {u.loginMethod === "google"
                      ? <span className="adm-method-badge adm-method-google">🔍 Google</span>
                      : <span className="adm-method-badge adm-method-email">✉️ Email</span>
                    }
                  </td>

                  <td className="adm-td adm-td-date">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>

                  <td className="adm-td adm-td-date">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>

                  <td className="adm-td adm-td-num">{u.loginCount || 1}</td>

                  <td className="adm-td">
                    <span className={`adm-status ${u.status === "banned" ? "adm-status-banned" : "adm-status-active"}`}>
                      {u.status === "banned" ? "🚫 Banned" : "✅ Active"}
                    </span>
                  </td>

                  <td className="adm-td">
                    <div className="adm-action-btns">
                      <button className="adm-view-btn" onClick={() => setSelUser(u)} title="View Details">👁</button>
                      {u.status === "banned"
                        ? <button className="adm-unban-btn" onClick={() => handleStatus(u.uid, "active")} title="Activate">✅</button>
                        : <button className="adm-ban-btn" onClick={() => handleStatus(u.uid, "banned")} title="Ban">🚫</button>
                      }
                      <button className="adm-del-btn" onClick={() => handleDelete(u.uid)} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selUser && (
        <div className="adm-modal-overlay" onClick={() => setSelUser(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <button className="adm-modal-close" onClick={() => setSelUser(null)}>✕</button>
            <div className="adm-modal-header">
              {selUser.photo
                ? <img src={selUser.photo} width={56} height={56} className="adm-modal-img" alt={selUser.name} />
                : <div className="adm-modal-initials">{(selUser.name || "U").slice(0, 2).toUpperCase()}</div>
              }
              <div>
                <div className="adm-modal-name">{selUser.name}</div>
                <div className="adm-modal-email">{selUser.email}</div>
              </div>
            </div>

            <div className="adm-modal-body">
              {[
                ["UID", selUser.uid],
                ["Login Method", selUser.loginMethod === "google" ? "🔍 Google OAuth" : "✉️ Email / Password"],
                ["Status", selUser.status === "banned" ? "🚫 Banned" : "✅ Active"],
                ["Member Since", selUser.createdAt ? new Date(selUser.createdAt).toLocaleString("en-IN") : "—"],
                ["Last Login", selUser.lastLogin ? new Date(selUser.lastLogin).toLocaleString("en-IN") : "—"],
                ["Total Logins", selUser.loginCount || 1],
                ["Phone", selUser.phone || "—"],
                ["Country", selUser.country || "—"],
              ].map(([k, v]) => (
                <div key={k} className="adm-modal-row">
                  <span className="adm-modal-key">{k}</span>
                  <span className="adm-modal-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="adm-modal-footer">
              {selUser.status === "banned"
                ? <button className="adm-unban-btn adm-modal-action-btn" onClick={() => handleStatus(selUser.uid, "active")}>✅ Activate User</button>
                : <button className="adm-ban-btn adm-modal-action-btn" onClick={() => handleStatus(selUser.uid, "banned")}>🚫 Ban User</button>
              }
              <button className="adm-del-btn adm-modal-action-btn" onClick={() => handleDelete(selUser.uid)}>🗑 Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}