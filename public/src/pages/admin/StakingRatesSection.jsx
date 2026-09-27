import { useState, useEffect } from "react";
import { API } from "../../config/api";

export default function StakingRatesSection() {
  const [coins, setCoins] = useState([]);
  const [rates, setRates] = useState({});
  const [msg, setMsg] = useState(null);

  const fetch = async () => {
    try {
      const r = await (await fetch(`${API}/api/staking/rates`)).json();
      if (Array.isArray(r)) {
        setCoins(r);
        const m = {};
        r.forEach(c => { m[c.coinId] = c.rate; });
        setRates(m);
      }
    } catch {}
  };

  useEffect(() => { fetch(); }, []);

  const handleSet = async (coinId, symbol, name) => {
    const rate = rates[coinId];
    if (rate === undefined || rate === "") return;
    const r = await (await fetch(`${API}/api/staking/rates/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coinId, symbol, name, rate: Number(rate) })
    })).json();
    if (r.success) { setMsg(r.message); } else { setMsg(r.error); }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#fff", marginBottom: 16 }}>Staking Rates</h2>
      {msg && <div style={{ color: "#f7931a", marginBottom: 12 }}>{msg}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="adm-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Coin</th><th>Symbol</th><th>Rate (%)</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {coins.map(c => (
              <tr key={c.coinId}>
                <td>{c.name}</td>
                <td>{c.symbol}</td>
                <td>
                  <input
                    style={{
                      width: 80, padding: "4px 8px", borderRadius: 4,
                      border: "1px solid #333", background: "#1a1a2e", color: "#fff"
                    }}
                    type="number" step="0.01"
                    value={rates[c.coinId] ?? ""}
                    onChange={e => setRates(s => ({ ...s, [c.coinId]: e.target.value }))}
                  />
                </td>
                <td>
                  <button className="adm-btn-primary" onClick={() => handleSet(c.coinId, c.symbol, c.name)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
