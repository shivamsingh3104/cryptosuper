import { useState, useEffect, useCallback } from "react";

const fmt = (n, d = 2) => n == null ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function fmtBig(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3)  return (n / 1e3).toFixed(2) + "K";
  return String(n);
}

const COLS = [
  { key: "market_cap",            label: "MKT CAP" },
  { key: "fully_diluted_valuation",label: "FD MKT CAP" },
  { key: "current_price",         label: "PRICE" },
  { key: "circulating_supply",    label: "AVAIL COINS" },
  { key: "total_supply",          label: "TOTAL COINS" },
  { key: "total_volume",          label: "TRADED VOL" },
  { key: "price_change_percentage_24h", label: "CHG %" },
];

export default function MarketCap() {
  const [coins,   setCoins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [sortCol, setSortCol] = useState("market_cap");
  const [sortDir, setSortDir] = useState("desc");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const PER = 20;

  const fetchData = useCallback(async () => {
    try {
      const ids = ["bitcoin","ethereum","tether","xrp","binancecoin","usd-coin","solana","tron","dogecoin","hyperliquid","leo-token","wrapped-bitcoin","cardano","avalanche-2","chainlink","shiba-inu","toncoin","polkadot","bitcoin-cash","near","litecoin","uniswap","internet-computer","stellar","ethereum-classic","okb","cronos","aptos","sui","hedera","filecoin","cosmos","the-graph","render-token","injective-protocol","aave","algorand","vechain","elrond","decentraland"];
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}&order=market_cap_desc&per_page=40&page=1&sparkline=false&price_change_percentage=24h`);
      const data = await res.json();
      setCoins(data);
      setError(null);
    } catch (e) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 60000); return () => clearInterval(t); }, [fetchData]);

  const filtered = coins.filter(c =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const pages = Math.ceil(filtered.length / PER);
  const rows  = filtered.slice((page - 1) * PER, page * PER);

  const handleSort = (k) => {
    if (sortCol === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(k); setSortDir("desc"); }
  };

  return (
    <div className="tool-page">
      {/* Toolbar */}
      <div className="tool-toolbar">
        <div className="tool-toolbar-left">
          <span className="tool-match-count">{filtered.length} MATCHES</span>
        </div>
        <div className="tool-toolbar-right">
          <div className="tool-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="tool-search" placeholder="Search coin…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button className="tool-refresh-btn" onClick={fetchData}>↻ Refresh</button>
        </div>
      </div>

      {/* Table */}
      {loading && <div className="tool-loading"><div className="spinner" /><p>Loading market cap data…</p></div>}
      {error   && <div className="tool-error"><p>{error}</p><button onClick={fetchData}>Retry</button></div>}

      {!loading && !error && (
        <>
          <div className="tool-table-wrap">
            <table className="tool-table">
              <thead>
                <tr>
                  <th className="tc-name">
                    <div>NAME</div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 400 }}>{filtered.length} MATCHES</div>
                  </th>
                  {COLS.map(c => (
                    <th key={c.key} className={`tc-num${sortCol === c.key ? " sorted" : ""}`} onClick={() => handleSort(c.key)}>
                      {c.label}
                      <span className="tc-sort">{sortCol === c.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const chg = c.price_change_percentage_24h ?? 0;
                  return (
                    <tr key={c.id} className="tc-row">
                      <td className="tc-name-cell">
                        <img src={c.image} width={28} height={28} alt={c.name} style={{ borderRadius: "50%", flexShrink: 0 }} />
                        <div>
                          <a href="#" className="tc-coin-name">{c.name}</a>
                        </div>
                      </td>
                      <td className="tc-num-cell">{fmtBig(c.market_cap)}</td>
                      <td className="tc-num-cell">{fmtBig(c.fully_diluted_valuation)}</td>
                      <td className="tc-num-cell">{c.current_price?.toFixed(8).replace(/\.?0+$/, "") ?? "—"}</td>
                      <td className="tc-num-cell">{fmtBig(c.circulating_supply)}</td>
                      <td className="tc-num-cell">{fmtBig(c.total_supply)}</td>
                      <td className="tc-num-cell">{fmtBig(c.total_volume)}</td>
                      <td className={`tc-num-cell ${chg >= 0 ? "tc-green" : "tc-red"}`}>
                        {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="tool-pagination">
              <button className="tp-arrow" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i+1} className={`tp-btn${page === i+1 ? " active" : ""}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="tp-arrow" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
