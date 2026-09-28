import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";

const TABS = [
  { label: "All transactions", path: "/history" },
  { label: "Deposits",         path: "/history/deposits" },
  { label: "Withdrawals",      path: "/history/withdrawals" },
  { label: "Transfers",        path: "/history/transfers" },
  { label: "Earnings",         path: "/history/earnings" },
];

export default function HistoryPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [allTx, setAllTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const path = window.location.pathname;
  const activeTab = TABS.find(t => t.path === path) || TABS[0];

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/api/transactions/user/${user.uid}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAllTx(data);
        else setAllTx([]);
      })
      .catch(() => setAllTx([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = () => {
    if (activeTab.label === "All transactions") return allTx;
    const typeMap = {
      "Deposits": "deposit",
      "Withdrawals": "withdrawal",
      "Transfers": "swap",
      "Earnings": "trade",
    };
    return allTx.filter(t => t.type === typeMap[activeTab.label]);
  };

  const list = filtered();

  const fmtDate = (d) => {
    if (!d) return "—";
    if (typeof d.toDate === "function") return new Date(d.toDate()).toLocaleString();
    if (d._seconds) return new Date(d._seconds * 1000).toLocaleString();
    return new Date(d).toLocaleString();
  };

  const fmtAmount = (tx) => {
    if (tx.type === "trade") {
      const qty = Number(tx.quantity) || 0;
      return <>{tx.side === "buy" ? "-" : "+"}{qty.toFixed(6)} {tx.symbol?.replace("USDT","")}</>;
    }
    if (tx.type === "swap") {
      return <>{tx.fromAmount} {tx.fromCurrency} → {tx.toAmount} {tx.toCurrency}</>;
    }
    const amt = Number(tx.amount);
    if (isNaN(amt)) return <>0.00</>;
    // Coin alag ho to symbol ke saath dikhao. Hardcode "$" karne se 0.5 BTC
    // jaisa crypto deposit "$0.50" dikhta, jo galat hota.
    const cur = tx.currency || "USD";
    return <>{cur === "USD" ? "$" : ""}{amt.toLocaleString(undefined, { maximumFractionDigits: 8 })}{cur !== "USD" ? ` ${cur}` : ""}</>;
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: 24 }}>
        <h2 style={{ color: "#111", marginBottom: 12 }}>Please Log In</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>You need to log in to view your history.</p>
        <button onClick={() => navigate("/login")} style={{ padding: "10px 30px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="hp-page">
      <h1 className="hp-title">Transaction History</h1>

      {/* Tabs */}
      <div className="hp-tabs">
        {TABS.map(t => (
          <button
            key={t.path}
            className={`hp-tab${activeTab.path === t.path ? " active" : ""}`}
            onClick={() => navigate(t.path)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="hp-table-wrap">
        {loading ? (
          <p className="hp-loading">Loading...</p>
        ) : list.length === 0 ? (
          <div className="hp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            <p>No {activeTab.label.toLowerCase()} yet</p>
          </div>
        ) : (
          <table className="hp-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Details</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map(tx => (
                <tr key={tx.id} className="hp-row">
                  <td>
                    <span className={`hp-type-badge ${tx.type}`}>
                      {tx.type === "deposit" && "📥 Deposit"}
                      {tx.type === "withdrawal" && "📤 Withdrawal"}
                      {tx.type === "swap" && "🔄 Swap"}
                      {tx.type === "trade" && "📊 Trade"}
                    </span>
                  </td>
                  <td className="hp-amount">{fmtAmount(tx)}</td>
                  <td className="hp-details">
                    {tx.type === "deposit" && (tx.method ? `Via ${tx.method}` : tx.transactionHash ? `Tx: ${tx.transactionHash?.slice(0,12)}...` : "—")}
                    {tx.type === "withdrawal" && `To: ${tx.walletAddress?.slice(0,10)}...`}
                    {tx.type === "swap" && `${tx.fromAmount} ${tx.fromCurrency} → ${tx.toAmount} ${tx.toCurrency}`}
                    {tx.type === "trade" && `${tx.side?.toUpperCase()} ${Number(tx.quantity).toFixed(6)} @ $${Number(tx.price).toFixed(2)}`}
                  </td>
                  <td>
                    <span className={`hp-status ${tx.status || "pending"}`}>{tx.status || "pending"}</span>
                  </td>
                  <td className="hp-date">{fmtDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .hp-page { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; min-height: calc(100vh - 56px); }
        .hp-title { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 24px; }
        .hp-tabs { display: flex; gap: 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; overflow-x: auto; }
        .hp-tab { background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 20px; font-size: 14px; font-weight: 500; color: #9ca3af; cursor: pointer; white-space: nowrap; }
        .hp-tab.active { color: #111; border-bottom-color: #3b82f6; font-weight: 700; }
        .hp-tab:hover { color: #555; }
        .hp-table-wrap { border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; }
        .hp-loading { text-align: center; padding: 48px; color: #9ca3af; }
        .hp-empty { text-align: center; padding: 48px; color: #bbb; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .hp-table { width: 100%; border-collapse: collapse; }
        .hp-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #aaa; background: #fafafa; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
        .hp-table td { padding: 14px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9f9f9; }
        .hp-row:last-child td { border-bottom: none; }
        .hp-type-badge { font-weight: 600; font-size: 12px; white-space: nowrap; }
        .hp-amount { font-weight: 600; }
        .hp-details { font-size: 12px; color: #6b7280; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hp-date { font-size: 12px; color: #9ca3af; white-space: nowrap; }
        .hp-status { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; text-transform: capitalize; }
        .hp-status.pending { background: #fef3c7; color: #d97706; }
        .hp-status.approved,
        .hp-status.processed,
        .hp-status.completed { background: #d1fae5; color: #059669; }
        .hp-status.cancelled,
        .hp-status.rejected { background: #fee2e2; color: #dc2626; }
      `}</style>
    </div>
  );
}
