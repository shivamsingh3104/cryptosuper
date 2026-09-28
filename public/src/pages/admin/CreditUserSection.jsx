import { useCallback, useEffect, useMemo, useState } from "react";
import { API, headers } from "../../config/api";
import { fmtDate } from "../../utils/date";

// Backend ke config/coins.js se match karta hai. Order wahi rakha hai.
const COINS = [
  "USDT", "BTC", "ETH", "USDC", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX",
  "AVAX", "LINK", "DOT", "UNI", "LTC", "NEAR", "APT", "SUI", "FET", "PEPE",
  "SHIB", "TON", "ICP", "BCH", "WBTC", "MATIC",
];

const fmtNum = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function CreditUserSection() {
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form state
  const [query, setQuery] = useState("");
  const [uid, setUid] = useState("");
  const [coin, setCoin] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState([]);

  const showMsg = (kind, text) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 5000);
  };

  // Naye user bante hi dropdown me aa jane chahiye — isliye har load par
  // list dobara mangate hain, cache nahi karte.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, balRes] = await Promise.all([
        fetch(`${API}/api/admin/users`, { headers }),
        fetch(`${API}/api/admin/balances`, { headers }),
      ]);

      // 401 ka matlab token stale hai (server restart) — "0 users" dikhana
      // galat hota, user ko login karwao.
      if (usersRes.status === 401 || balRes.status === 401) {
        setUsers([]);
        setBalances({});
        showMsg("err", "Session expire ho gaya. Dobara login karein.");
        return;
      }
      if (!usersRes.ok) {
        setUsers([]);
        setBalances({});
        showMsg("err", (await usersRes.json())?.error || "Users load nahi ho sake");
        return;
      }

      const u = await usersRes.json();
      const b = balRes.ok ? await balRes.json() : {};
      setUsers(Array.isArray(u) ? u : []);
      setBalances(b && typeof b === "object" ? b : {});
    } catch {
      setUsers([]);
      setBalances({});
      showMsg("err", "Backend se connect nahi ho paaya");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/deposits`, { headers });
      const data = await res.json();
      setHistory(
        (Array.isArray(data) ? data : [])
          .filter(d => d.type === "admin-credit")
          .slice(0, 15)
      );
    } catch {
      /* history auxiliary hai, fail hone par form kaam karta rahe */
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, [fetchData, fetchHistory]);

  // Search ke hisaab se filtered list — dropdown me sirf matching users.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...users].sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      if (an === bn) return (a.createdAt || "") < (b.createdAt || "") ? 1 : -1;
      return an < bn ? -1 : 1;
    });
    if (!q) return list;
    return list.filter(
      u =>
        (u.email || "").toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.uid || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const selected = users.find(u => u.uid === uid) || null;
  const selectedBal = uid ? balances[uid] : null;

  const resetForm = () => {
    setAmount("");
    setNote("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!uid) return showMsg("err", "Pehle user choose karo");
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return showMsg("err", "Amount 0 se zyada honi chahiye");
    }
    if (!window.confirm(
      `${fmtNum(value)} ${coin} → ${selected?.name || selected?.email}?\n\nBalance turant update ho jayega.`
    )) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/credit`, {
        method: "POST",
        headers,
        body: JSON.stringify({ uid, amount: value, coin, note }),
      });
      const data = await res.json();

      if (data.error) {
        showMsg("err", data.error);
      } else {
        showMsg("ok", data.message);
        resetForm();
        // Balance turant reflect ho — list + history dono refresh.
        await Promise.all([fetchData(), fetchHistory()]);
      }
    } catch {
      showMsg("err", "Server error. Dobara try karo.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.65rem 0.8rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    background: "#fff",
  };
  const labelStyle = {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: "0.35rem",
  };

  return (
    <div>
      {msg && (
        <div
          style={{
            padding: "0.7rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            fontWeight: 600,
            fontSize: "0.85rem",
            background: msg.kind === "ok" ? "#d1fae5" : "#fee2e2",
            color: msg.kind === "ok" ? "#065f46" : "#991b1b",
          }}
        >
          {msg.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Add Money to Wallet</h2>
        <button
          onClick={fetchData}
          style={{
            padding: "0.4rem 1rem",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <p style={{ margin: "0 0 1.25rem", color: "#64748b", fontSize: "0.85rem" }}>
        User deposit button khud nahi daba sakta — paisa aap yahan se bhejte ho.
        Credit karte hi user ka balance update ho jata hai aur uski history me
        record aa jata hai.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr)",
          gap: "1.25rem",
        }}
      >
        <form
          onSubmit={submit}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "0.9rem",
            padding: "1.25rem",
            maxWidth: "620px",
          }}
        >
          {/* Search */}
          <div style={{ marginBottom: "0.85rem" }}>
            <label style={labelStyle}>Search user</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name, email ya UID…"
              style={inputStyle}
            />
          </div>

          {/* User dropdown — naye user khud-b-a-khud list me aa jate hain */}
          <div style={{ marginBottom: "0.85rem" }}>
            <label style={labelStyle}>
              User ({filtered.length} of {users.length})
            </label>
            <select
              value={uid}
              onChange={e => setUid(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— Select user —</option>
              {filtered.map(u => {
                const bal = balances[u.uid]?.balance ?? 0;
                return (
                  <option key={u.uid} value={u.uid}>
                    {u.name || "(no name)"} · {u.email} — ${fmtNum(bal)}
                  </option>
                );
              })}
            </select>
            {loading && (
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.35rem 0 0" }}>
                Loading users…
              </p>
            )}
            {!loading && users.length === 0 && (
              <p style={{ fontSize: "0.75rem", color: "#dc2626", margin: "0.35rem 0 0" }}>
                Koi user nahi mila. Agar aaphe login kiya tha to page refresh karke
                dobara login karein.
              </p>
            )}
            {!loading && users.length > 0 && filtered.length === 0 && (
              <p style={{ fontSize: "0.75rem", color: "#b45309", margin: "0.35rem 0 0" }}>
                Is search se koi user nahi mila.
              </p>
            )}
          </div>

          {/* Selected user summary */}
          {selected && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "0.6rem",
                padding: "0.75rem 0.9rem",
                marginBottom: "1rem",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "#0f172a" }}>
                {selected.name || "(no name)"}
              </div>
              <div style={{ color: "#64748b" }}>{selected.email}</div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.72rem",
                  wordBreak: "break-all",
                  marginTop: "0.2rem",
                }}
              >
                UID: {selected.uid}
              </div>
              <div style={{ marginTop: "0.5rem", color: "#0f172a" }}>
                Current USDT balance:{" "}
                <strong>{fmtNum(selectedBal?.balance)}</strong>
              </div>
              {selectedBal?.coins && Object.keys(selectedBal.coins).length > 0 && (
                <div
                  style={{
                    marginTop: "0.35rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.3rem",
                  }}
                >
                  {Object.entries(selectedBal.coins)
                    .filter(([s]) => s !== "USDT")
                    .map(([s, v]) => (
                      <span
                        key={s}
                        style={{
                          background: "#e2e8f0",
                          color: "#334155",
                          borderRadius: "999px",
                          padding: "0.1rem 0.5rem",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        {s} {fmtNum(v)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.85rem",
              marginBottom: "0.85rem",
            }}
          >
            <div>
              <label style={labelStyle}>Coin</label>
              <select
                value={coin}
                onChange={e => setCoin(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {COINS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Amount</label>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.1rem" }}>
            <label style={labelStyle}>Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Payment received on 28 Sep"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !uid}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: !uid ? "#cbd5e1" : "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: !uid || saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Crediting…" : `Credit ${amount || "0"} ${coin}`}
          </button>
        </form>
      </div>

      {/* Recent admin credits */}
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.6rem" }}>
          Recent Credits
        </h3>
        {history.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Abhi koi credit nahi kiya gaya.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  {["User", "Amount", "Coin", "Note", "By", "Date"].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: "0.5rem 0.6rem",
                        textAlign: "left",
                        color: "#64748b",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600 }}>
                      {h.userEmail || h.userId?.slice(0, 12)}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 700, color: "#059669" }}>
                      +{fmtNum(h.creditedAmount ?? h.amount)}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem" }}>{h.coin || "USDT"}</td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "#64748b" }}>
                      {h.note || "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "#64748b" }}>
                      {h.processedBy || "admin"}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "#64748b", fontSize: "0.75rem" }}>
                      {fmtDate(h.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
