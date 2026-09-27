import { useState, useEffect } from "react";
import { API, headers } from "../../config/api";

export default function SwapSection() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/swaps`, { headers });
      const data = await res.json();
      setSwaps(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSwaps(); }, []);

  const processSwap = async (id) => {
    if (!window.confirm("Mark this swap as processed?")) return;
    try {
      const res = await fetch(`${API}/api/admin/swaps/${id}/process`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ adminId: "admin" })
      });
      const data = await res.json();
      if (data.success) {
        alert("Swap processed! User can now claim.");
        fetchSwaps();
      } else {
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Swap Requests</h2>
        <button onClick={fetchSwaps} style={{ padding: "0.4rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : swaps.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "1rem", border: "2px dashed #e2e8f0", color: "#94a3b8" }}>
          No swap requests yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>User</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>From</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>To</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pay</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hash Key</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {swaps.map(swap => (
                <tr key={swap.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.6rem" }}>
                    <div style={{ fontWeight: 600 }}>{swap.userEmail || swap.userId?.slice(0, 8)}</div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{swap.userId?.slice(0, 16)}...</div>
                  </td>
                  <td style={{ padding: "0.6rem", fontWeight: 600 }}>{swap.fromCurrency}</td>
                  <td style={{ padding: "0.6rem", fontWeight: 600 }}>{swap.toCurrency}</td>
                  <td style={{ padding: "0.6rem" }}>{swap.fromAmount} → {swap.toAmount}</td>
                  <td style={{ padding: "0.6rem" }}>${swap.amountToPay?.toFixed(2)}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <code style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "0.15rem 0.3rem", borderRadius: "0.25rem" }}>
                      {swap.hashKey}
                    </code>
                  </td>
                  <td style={{ padding: "0.6rem" }}>
                    <span className={`badge-${swap.status}`} style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "1rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: swap.status === "pending" ? "#fef3c7" : swap.status === "processed" ? "#dbeafe" : "#d1fae5",
                      color: swap.status === "pending" ? "#92400e" : swap.status === "processed" ? "#1e40af" : "#065f46",
                    }}>
                      {swap.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem" }}>
                    {swap.status === "pending" ? (
                      <button
                        onClick={() => processSwap(swap.id)}
                        style={{
                          padding: "0.35rem 0.8rem",
                          background: "#059669",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          cursor: "pointer"
                        }}
                      >
                        Process
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>—</span>
                    )}
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
