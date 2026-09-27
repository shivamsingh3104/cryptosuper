import { useState, useEffect } from "react";
import { API, headers } from "../../config/api";

export default function WithdrawalsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/withdrawals`, { headers });
      const data = await res.json();
      setItems(data || []);
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  };

  useEffect(() => { fetchItems(); }, []);

  const approve = async (id) => {
    if (!window.confirm("Approve this withdrawal? Balance will be deducted.")) return;
    try {
      const res = await fetch(`${API}/api/admin/withdrawals/${id}/approve`, { method: "PUT", headers });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchItems();
    } catch (err) { alert("Server error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Withdrawal Requests</h2>
        <button onClick={fetchItems} style={{ padding: "0.4rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}>Refresh</button>
      </div>
      {loading ? <p>Loading...</p> : items.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "1rem", border: "2px dashed #e2e8f0", color: "#94a3b8" }}>No withdrawal requests.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>User</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Amount</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Wallet Address</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.6rem" }}><div style={{ fontWeight: 600 }}>{item.userEmail || item.userId?.slice(0, 12)}</div></td>
                  <td style={{ padding: "0.6rem", fontWeight: 700, color: "#dc2626" }}>${item.amount}</td>
                  <td style={{ padding: "0.6rem" }}><code style={{ fontSize: "0.7rem", wordBreak: "break-all" }}>{item.walletAddress}</code></td>
                  <td style={{ padding: "0.6rem" }}><span style={{ padding: "0.15rem 0.5rem", borderRadius: "1rem", fontSize: "0.7rem", fontWeight: 700, background: item.status === "pending" ? "#fef3c7" : "#d1fae5", color: item.status === "pending" ? "#92400e" : "#065f46" }}>{item.status}</span></td>
                  <td style={{ padding: "0.6rem", color: "#64748b", fontSize: "0.75rem" }}>{item.createdAt ? new Date(item.createdAt.seconds * 1000 || item.createdAt).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "0.6rem" }}>
                    {item.status === "pending" ? (
                      <button onClick={() => approve(item.id)} style={{ padding: "0.35rem 0.8rem", background: "#059669", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>Approve</button>
                    ) : <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Done</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
