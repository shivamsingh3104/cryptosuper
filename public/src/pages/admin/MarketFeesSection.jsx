import { useState, useEffect } from "react";
import { API, headers } from "../../config/api";

const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";

export default function MarketFeesSection() {
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [allCoins, setAllCoins] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/market-fees`).then(r => r.json()),
      fetch(COINGECKO_URL).then(r => r.json())
    ])
    .then(([feesData, coinsData]) => {
      setFees(feesData || {});
      const coins = (coinsData || []).map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        image: c.image
      }));
      setAllCoins(coins);
      const vals = {};
      coins.forEach(c => {
        vals[c.id] = feesData[c.id] || "";
      });
      setEditValues(vals);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const saveFee = async (currencyId) => {
    const percentage = Number(editValues[currencyId]);
    if (isNaN(percentage)) {
      alert("Enter a valid percentage");
      return;
    }
    setSaving(currencyId);
    try {
      const res = await fetch(`${API}/api/market-fees/set`, {
        method: "POST",
        headers,
        body: JSON.stringify({ currencyId, percentage })
      });
      const data = await res.json();
      if (data.success) {
        setFees(prev => ({ ...prev, [currencyId]: percentage }));
        alert(`Saved: ${currencyId} → ${percentage}%`);
      }
    } catch (err) {
      alert("Error saving");
    } finally {
      setSaving(null);
    }
  };

  const filtered = search.trim()
    ? allCoins.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
      )
    : allCoins;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Market Fees</h2>
      </div>
      <p style={{ color: "#64748b", marginBottom: "1rem", fontSize: "0.85rem" }}>
        Set the percentage to add on top of the market price for each currency. Live data from CoinGecko — {allCoins.length} currencies loaded.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search currency by name or symbol..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem 0.8rem",
            border: "2px solid #e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      {loading ? (
        <p>Loading live currencies from CoinGecko...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Currency</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Symbol</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Admin %</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Current Fee</th>
                <th style={{ padding: "0.6rem", textAlign: "left", color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                    No currencies found for "{search}"
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.6rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {c.image && <img src={c.image} alt={c.name} width={20} height={20} style={{ borderRadius: "50%" }} />}
                      {c.name}
                    </div>
                  </td>
                  <td style={{ padding: "0.6rem" }}>{c.symbol}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={editValues[c.id] ?? ""}
                      onChange={e => setEditValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                      style={{
                        width: "80px",
                        padding: "0.4rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.4rem",
                        fontSize: "0.85rem"
                      }}
                    /> %
                  </td>
                  <td style={{ padding: "0.6rem" }}>
                    {fees[c.id] !== undefined ? (
                      <span style={{ fontWeight: 700, color: fees[c.id] > 0 ? "#059669" : "#94a3b8" }}>
                        {fees[c.id]}%
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: "0.6rem" }}>
                    <button
                      onClick={() => saveFee(c.id)}
                      disabled={saving === c.id}
                      style={{
                        padding: "0.35rem 0.8rem",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        opacity: saving === c.id ? 0.6 : 1
                      }}
                    >
                      {saving === c.id ? "..." : "Save"}
                    </button>
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
