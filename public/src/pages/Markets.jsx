import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCryptoData, fmtPrice, fmtVolume } from "../hooks/useCryptoData";
import SparklineChart from "../components/SparklineChart";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";

export default function Markets() {
  const { coins, loading, error, lastUpdated, refetch } = useCryptoData(30000);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [mainTab,      setMainTab]      = useState("Spot");       // Favorites | Spot | Futures
  const [filterTab,    setFilterTab]    = useState("Crypto");     // All | Crypto | State Currencies
  const [search,       setSearch]       = useState("");
  const [sortCol,      setSortCol]      = useState("marketCap");
  const [sortDir,      setSortDir]      = useState("desc");
  const [favorites,    setFavorites]    = useState(new Set());
  const [visualization,setVisualization]= useState(true);
  const [page,         setPage]         = useState(1);
  const [marketFees,   setMarketFees]   = useState({});
  const PER_PAGE = 10;

  useEffect(() => {
    fetch(`${API}/api/market-fees`)
      .then(r => r.json())
      .then(data => setMarketFees(data || {}))
      .catch(() => {});
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
    setPage(1);
  };

  const sortIcon = (col) => {
    if (sortCol !== col) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const filtered = useMemo(() => {
    let data = [...coins];
    data.forEach(c => {
      const feePct = marketFees[c.id] || 0;
      c.adminFee = feePct;
      c.ourPrice = c.lastPrice != null ? c.lastPrice * (1 + feePct / 100) : null;
    });
    if (mainTab === "Favorites") data = data.filter(c => favorites.has(c.pair));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.pair.toLowerCase().includes(q) ||
        c.fullName?.toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return data;
  }, [coins, search, sortCol, sortDir, mainTab, favorites, marketFees]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleFav = (e, pair) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(pair) ? next.delete(pair) : next.add(pair);
      return next;
    });
  };

  return (
    <div className="mkp-wrap">
      <h1 className="mkp-title">Markets</h1>

      {/* Top tabs row */}
      <div className="mkp-top-row">
        <div className="mkp-main-tabs">
          {["Favorites", "Spot", "Futures"].map(t => (
            <button
              key={t}
              className={`mkp-main-tab${mainTab === t ? " active" : ""}`}
              onClick={() => { setMainTab(t); setPage(1); }}
            >
              {t === "Favorites" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={mainTab === "Favorites" ? "#f59e0b" : "none"} stroke={mainTab === "Favorites" ? "#f59e0b" : "#aaa"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              )}
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mkp-search-wrap">
          <svg className="mkp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            className="mkp-search"
            placeholder="Search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="mkp-filter-row">
        <div className="mkp-filter-tabs">
          <button className={`mkp-filter-tab${filterTab === "All" ? " active" : ""}`} onClick={() => setFilterTab("All")}>All</button>
          <button className={`mkp-filter-tab${filterTab === "Crypto" ? " active" : ""}`} onClick={() => setFilterTab("Crypto")}>Crypto</button>
          <button className="mkp-filter-tab mkp-filter-soon">
            State Currencies
            <span className="mkp-soon-badge">Soon</span>
          </button>
        </div>

        {/* Visualization toggle */}
        <div className="mkp-viz-wrap">
          <button
            className={`mkp-viz-toggle${visualization ? " on" : ""}`}
            onClick={() => setVisualization(v => !v)}
            role="switch"
            aria-checked={visualization}
          >
            <span className="mkp-viz-knob" />
          </button>
          <span className="mkp-viz-label">Visualization</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mkp-divider" />

      {/* Table */}
      {loading && (
        <div className="mkp-loading">
          <div className="spinner" />
          <p>Loading live market data…</p>
        </div>
      )}

      {error && !loading && (
        <div className="mkp-error">
          <p>Failed to load data. <button onClick={refetch}>Retry</button></p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mkp-table-wrap">
            <table className="mkp-table">
              <thead>
                <tr>
                  <th className="mkp-th-star" />
                  <th className="mkp-th mkp-sortable" onClick={() => handleSort("name")}>
                    Trading Pairs {sortIcon("name")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("lastPrice")}>
                    Last Price {sortIcon("lastPrice")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("change")}>
                    24H Change % {sortIcon("change")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("high")}>
                    24H High {sortIcon("high")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("low")}>
                    24H Low {sortIcon("low")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("volume")}>
                    24H Volume {sortIcon("volume")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("adminFee")}>
                    Admin % {sortIcon("adminFee")}
                  </th>
                  <th className="mkp-th mkp-sortable mkp-th-right" onClick={() => handleSort("ourPrice")}>
                    Our Price {sortIcon("ourPrice")}
                  </th>
                  {visualization && (
                    <th className="mkp-th mkp-th-center">Crypto Markets</th>
                  )}
                  <th className="mkp-th mkp-th-center"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visualization ? 11 : 10} className="mkp-empty">
                      {mainTab === "Favorites" ? "No favorites yet. Click ☆ to add." : `No results for "${search}"`}
                    </td>
                  </tr>
                ) : paginated.map((c, i) => (
                  <tr key={c.id || i} className="mkp-row">
                    {/* Star */}
                    <td className="mkp-td-star">
                      <button
                        className="mkp-star-btn"
                        onClick={(e) => toggleFav(e, c.pair)}
                        title={favorites.has(c.pair) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24"
                          fill={favorites.has(c.pair) ? "#f59e0b" : "none"}
                          stroke={favorites.has(c.pair) ? "#f59e0b" : "#ccc"}
                          strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </button>
                    </td>

                    {/* Coin name */}
                    <td className="mkp-td-coin">
                      <div className="mkp-coin-row">
                        {c.image
                          ? <img src={c.image} width={32} height={32} alt={c.name} className="mkp-coin-img" />
                          : <div className="mkp-coin-fallback" style={{ background: c.bg }}>{c.icon}</div>
                        }
                        <div>
                          <div className="mkp-coin-symbol">{c.name} / USDT</div>
                          <div className="mkp-coin-name">{c.fullName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Last Price */}
                    <td className="mkp-td-right mkp-price">{fmtPrice(c.lastPrice)}</td>

                    {/* 24H Change */}
                    <td className="mkp-td-right">
                      <span className={`mkp-change${c.pos ? " pos" : " neg"}`}>
                        {c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%
                      </span>
                    </td>

                    {/* 24H High */}
                    <td className="mkp-td-right mkp-high">{fmtPrice(c.high)}</td>

                    {/* 24H Low */}
                    <td className="mkp-td-right mkp-low">{fmtPrice(c.low)}</td>

                    {/* 24H Volume */}
                    <td className="mkp-td-right mkp-vol">
                      {fmtVolume(c.volume)} (USDT)
                    </td>

                    {/* Admin % */}
                    <td className="mkp-td-right">
                      <span style={{
                        fontWeight: 700,
                        color: c.adminFee > 0 ? "#059669" : "#94a3b8",
                        fontSize: "0.85rem"
                      }}>
                        {c.adminFee > 0 ? `+${c.adminFee}%` : "—"}
                      </span>
                    </td>

                    {/* Our Price */}
                    <td className="mkp-td-right" style={{ fontWeight: 700, color: "#2563eb" }}>
                      {c.ourPrice != null ? fmtPrice(c.ourPrice) : "—"}
                    </td>

                    {/* Sparkline — hidden when visualization off */}
                    {visualization && (
                      <td className="mkp-td-center">
                        <SparklineChart
                          data={c.sparkline}
                          positive={c.pos}
                          width={100}
                          height={36}
                        />
                      </td>
                    )}

                    {/* Trade */}
                    <td className="mkp-td-center">
                      <button
                        className="mkp-trade-btn"
                        onClick={() => {
                          if (isLoggedIn) {
                            navigate(`/spot?pair=${c.pair.replace("/", "")}`);
                          } else {
                            navigate("/login", { state: { from: `/spot?pair=${c.pair.replace("/", "")}` } });
                          }
                        }}
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mkp-pagination">
              <button
                className="mkp-page-arrow"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`mkp-page-btn${page === p ? " active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="mkp-page-arrow"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          )}

          <div className="mkp-live-badge">
            <span className="mkp-live-dot" />
            Auto-refreshes every 30s · Powered by CoinGecko
          </div>
        </>
      )}
    </div>
  );
}
