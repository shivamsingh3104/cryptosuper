import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSpotData } from "../hooks/useSpotData";
import { API } from "../config/api";
import authedFetch from "../utils/authedFetch";

const PAIRS = [
  "BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT",
  "DOTUSDT","TRXUSDT","MATICUSDT","LTCUSDT","LINKUSDT","XLMUSDT","ATOMUSDT",
  "UNIUSDT","TONUSDT","SHIBUSDT","APTUSDT","ARBUSDT","OPUSDT",
];

const fmt = (n, d = 2) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtTime = (d) =>
  d?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

function CandleChart({ candles, theme, zoom }) {
  const ref = useRef(null);
  const [mousePos, setMousePos] = useState(null);
  const dragStart = useRef(null);
  const offset = useRef(0);

  const visibleCount = Math.max(10, Math.floor(candles.length / zoom));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || candles.length < 2) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const isDark = theme === "dark";
    const bg = isDark ? "#0d0d0d" : "#f8fafc";
    const gridC = isDark ? "#1e1e1e" : "#e2e8f0";
    const textC = isDark ? "#555" : "#94a3b8";
    const lineC = isDark ? "#3b82f6" : "#2563eb";

    const VOLUME_H = H * 0.15;
    const CHART_H = H - VOLUME_H - 8;
    const startIdx = Math.max(0, candles.length - visibleCount - Math.round(offset.current));
    const endIdx = Math.min(candles.length, startIdx + visibleCount);
    const visCandles = candles.slice(startIdx, endIdx);
    const n = visCandles.length;
    if (n < 2) return;
    const barW = Math.max(2, (W / n) * 0.7);
    const gap = W / n;

    const prices = visCandles.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const rangeP = maxP - minP || 1;
    const maxVol = Math.max(...visCandles.map(c => c.volume)) || 1;

    const toY = (p) => CHART_H - ((p - minP) / rangeP) * CHART_H * 0.9 - CHART_H * 0.05;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = gridC;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (CHART_H / 5) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.fillStyle = textC;
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const p = maxP - (rangeP * i) / 5;
      const y = (CHART_H / 5) * i + 3;
      ctx.fillText(fmt(p, 2), W - 4, y);
    }

    visCandles.forEach((c, i) => {
      const x = i * gap + gap / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? "#26a69a" : "#ef5350";
      const oY = toY(c.open), cY = toY(c.close), hY = toY(c.high), lY = toY(c.low);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, hY); ctx.lineTo(x, lY); ctx.stroke();

      ctx.fillStyle = color;
      const bodyTop = Math.min(oY, cY);
      const bodyH = Math.max(1, Math.abs(oY - cY));
      ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);

      const volH = (c.volume / maxVol) * VOLUME_H * 0.85;
      ctx.fillStyle = isUp ? "rgba(38,166,154,0.4)" : "rgba(239,83,80,0.4)";
      ctx.fillRect(x - barW / 2, H - volH, barW, volH);
    });

    const lastC = visCandles[visCandles.length - 1];
    if (lastC) {
      const y = toY(lastC.close);
      ctx.strokeStyle = lineC;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - 60, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = lineC;
      ctx.fillRect(W - 60, y - 9, 60, 18);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(fmt(lastC.close, 2), W - 30, y + 4);
    }

    ctx.fillStyle = textC;
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    const step = Math.ceil(n / 8);
    visCandles.forEach((c, i) => {
      if (i % step === 0) {
        const x = i * gap + gap / 2;
        const t = new Date(c.time);
        ctx.fillText(`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`, x, H - 2);
      }
    });
  }, [candles, theme, zoom, visibleCount]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.1 : -0.1;
    offset.current = Math.max(0, Math.min(candles.length - visibleCount, offset.current));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={ref}
        onWheel={handleWheel}
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
      />
    </div>
  );
}

export default function Spot() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isLoggedIn) navigate("/login", { state: { from: "/spot" }, replace: true });
  }, [isLoggedIn, navigate]);

  const pairParam = searchParams.get("pair");
  const initialPair = pairParam && PAIRS.includes(pairParam) ? pairParam : "BTCUSDT";
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
  const [pairSearchText, setPairSearchText] = useState("");
  const pairWrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (pairWrapRef.current && !pairWrapRef.current.contains(e.target)) {
        setPairDropdownOpen(false);
        setPairSearchText("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const p = searchParams.get("pair");
    if (p && PAIRS.includes(p) && p !== selectedPair) {
      setSelectedPair(p);
    }
  }, [searchParams]);
  const { price, stats, asks, bids, trades, candles, loading } = useSpotData(selectedPair);

  const [orderType, setOrderType] = useState("Limit");
  const [buyAmt, setBuyAmt] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellAmt, setSellAmt] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [tradeHistory, setTradeHistory] = useState([]);
  const [usdtBal, setUsdtBal] = useState(0);
  const [btcBal, setBtcBal] = useState(0);
  const [chartTheme, setChartTheme] = useState("dark");
  const [chartZoom, setChartZoom] = useState(1);

  const fetchBalances = () => {
    if (!user?.uid) return;
    const base = selectedPair.replace("USDT", "");
    authedFetch(`/api/users/balance`)
      .then(r => r.json()).then(d => {
        setUsdtBal(d.balance || 0);
        setBtcBal(d[base + "Balance"] || 0);
      }).catch(() => {});
  };

  useEffect(() => {
    if (!user?.uid) return;
    fetchBalances();
    authedFetch(`/api/trading/history/${user.uid}`)
      .then(r => r.json()).then(d => setTradeHistory(d || [])).catch(() => {});
  }, [user?.uid, selectedPair]);

  useEffect(() => {
    fetchBalances();
  }, [tradeHistory]);

  useEffect(() => {
    if (price && orderType === "Market") {
      setBuyPrice(price);
      setSellPrice(price);
    }
  }, [price, orderType]);

  const pairBase = selectedPair.replace("USDT", "");
  const pairQuote = "USDT";

  const pos = (stats?.change24h ?? 0) >= 0;

  const placeOrder = async (side) => {
    if (!user?.uid) return alert("Login required");
    const amt = side === "Buy" ? buyAmt : sellAmt;
    const prc = side === "Buy" ? buyPrice : sellPrice;
    if (!amt || !prc) return alert("Fill all fields");

    try {
      const res = await authedFetch(`/api/trading/order`, {
        method: "POST",
        body: JSON.stringify({
          userId: user.uid,
          pair: selectedPair.replace("USDT", "/USDT"),
          side,
          type: orderType,
          amount: Number(amt),
          price: Number(prc)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        if (side === "Buy") { setBuyAmt(""); setBuyPrice(""); }
        else { setSellAmt(""); setSellPrice(""); }
        authedFetch(`/api/trading/history/${user.uid}`)
          .then(r => r.json()).then(d => setTradeHistory(d || [])).catch(() => {});
        authedFetch(`/api/users/balance`)
          .then(r => r.json()).then(d => {
            setUsdtBal(d.balance || 0);
            setBtcBal(d[pairBase + "Balance"] || 0);
          }).catch(() => {});
      } else {
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const setBuyPct = (pct) => {
    const max = usdtBal / (Number(buyPrice) || price || 1);
    setBuyAmt((max * pct / 100).toFixed(6));
  };

  const setSellPct = (pct) => {
    setSellAmt((btcBal * pct / 100).toFixed(6));
  };

  return (
    <div className="spot-page" style={chartTheme === "light" ? { background: "#f8fafc" } : {}}>
      <div className="spot-left">
        <div className="spot-pair-header">
          <div className="spot-pair-selector">
            <div className="spot-pair-dropdown-wrap" ref={pairWrapRef}>
              <button
                className="spot-pair-dropdown-btn"
                onClick={() => { setPairDropdownOpen(o => !o); setPairSearchText(""); }}
              >
                {stats?.image && <img src={stats.image} width={22} height={22} alt="" style={{ borderRadius: "50%" }} />}
                <span className="spot-pair-label">{selectedPair.replace("USDT", "/USDT")}</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: 4 }}>▼</span>
              </button>
              {pairDropdownOpen && (
                <div className="spot-pair-dropdown">
                  <input
                    className="spot-pair-search"
                    placeholder="Search pair..."
                    value={pairSearchText}
                    onChange={e => setPairSearchText(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <div className="spot-pair-list">
                    {PAIRS.filter(p => !pairSearchText || p.includes(pairSearchText)).map(p => (
                      <div
                        key={p}
                        className={`spot-pair-option${selectedPair === p ? " active" : ""}`}
                        onClick={() => { setSelectedPair(p); setPairDropdownOpen(false); setPairSearchText(""); }}
                      >
                        {p.replace("USDT", "/USDT")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="spot-pair-price" style={{ color: pos ? "#26a69a" : "#ef5350" }}>
            {loading ? "Loading…" : fmt(price, 2)}
          </div>
          <div className="spot-stats-row">
            <div className="spot-stat"><span className="spot-stat-label">24h Change</span><span className={`spot-stat-val ${pos ? "text-green" : "text-red"}`}>{pos ? "+" : ""}{fmt(stats?.change24h, 2)}%</span></div>
            <div className="spot-stat"><span className="spot-stat-label">24h High</span><span className="spot-stat-val text-green">{fmt(stats?.high24h, 2)}</span></div>
            <div className="spot-stat"><span className="spot-stat-label">24h Low</span><span className="spot-stat-val text-red">{fmt(stats?.low24h, 2)}</span></div>
            <div className="spot-stat"><span className="spot-stat-label">Volume (BTC)</span><span className="spot-stat-val">{fmt(stats?.vol24hBtc, 0)}</span></div>
            <div className="spot-stat"><span className="spot-stat-label">Volume (USDT)</span><span className="spot-stat-val">{fmt(stats?.vol24hUsd, 0)}</span></div>
          </div>
        </div>

        <div className="spot-chart-wrap" style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, display: "flex", gap: 4 }}>
            <button onClick={() => setChartTheme(t => t === "dark" ? "light" : "dark")}
              style={{ padding: "4px 8px", background: chartTheme === "dark" ? "#333" : "#fff", color: chartTheme === "dark" ? "#fff" : "#333", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
              {chartTheme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button onClick={() => setChartZoom(z => Math.min(3, z + 0.2))}
              style={{ padding: "4px 8px", background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>🔍+</button>
            <button onClick={() => setChartZoom(z => Math.max(0.3, z - 0.2))}
              style={{ padding: "4px 8px", background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>🔍-</button>
          </div>
          {loading
            ? <div className="spot-chart-loading"><div className="spot-spinner" /><p>Loading chart…</p></div>
            : <CandleChart candles={candles} theme={chartTheme} zoom={chartZoom} />
          }
        </div>

        <div className="spot-history-wrap">
          <div className="spot-history-tab">My Trading History</div>
          <table className="spot-history-table">
            <thead><tr><th>Date</th><th>Pair</th><th>Side</th><th>Type</th><th>Amount</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {tradeHistory.length === 0 ? (
                <tr><td colSpan={7} className="spot-no-records"><div className="spot-no-records-inner"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><p>No Records</p></div></td></tr>
              ) : tradeHistory.map(r => (
                <tr key={r.id}>
                  <td className="spot-ht-date">{r.createdAt ? (() => { const d = r.createdAt; if (typeof d.toDate === "function") return d.toDate().toLocaleString(); if (d._seconds) return new Date(d._seconds * 1000).toLocaleString(); if (d.seconds) return new Date(d.seconds * 1000).toLocaleString(); return new Date(d).toLocaleString(); })() : "—"}</td>
                  <td>{r.pair}</td>
                  <td style={{ color: r.side === "Buy" ? "#26a69a" : "#ef5350", fontWeight: 600 }}>{r.side}</td>
                  <td>{r.type}</td>
                  <td>{r.amount}</td>
                  <td>${fmt(r.price, 2)}</td>
                  <td>${fmt(r.total, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="spot-right">
        <div className="spot-book-trades">
          <div className="spot-book">
            <div className="spot-panel-title">Order Book</div>
            <div className="spot-book-header"><span>Price (USDT)</span><span>Size (BTC)</span><span>Total (USDT)</span></div>
              <div className="spot-asks">
                {asks.map((r, i) => (
                  <div key={i} className="spot-book-row spot-ask-row" onClick={() => { setBuyPrice(r.price.toFixed(2)); setSellPrice(r.price.toFixed(2)); }}>
                    <span className="spot-ask-price">{fmt(r.price, 2)}</span>
                  <span>{r.size.toFixed(5)}</span>
                  <span>{fmt(r.total, 2)}</span>
                </div>
              ))}
            </div>
            <div className="spot-mid-price" style={{ color: pos ? "#26a69a" : "#ef5350" }}>{fmt(price, 2)} {pos ? "↑" : "↓"}</div>
            <div className="spot-bids">
              {bids.map((r, i) => (
                <div key={i} className="spot-book-row spot-bid-row" onClick={() => { setSellPrice(r.price); setBuyPrice(r.price); }}>
                  <span className="spot-bid-price">{fmt(r.price, 2)}</span>
                  <span>{r.size.toFixed(5)}</span>
                  <span>{fmt(r.total, 2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="spot-trades">
            <div className="spot-panel-title">Trades</div>
            <div className="spot-book-header"><span>Price (USDT)</span><span>Size (BTC)</span></div>
            <div className="spot-trades-list">
              {trades.map((t, i) => (
                <div key={i} className="spot-trade-row">
                  <span style={{ color: t.isBuy ? "#26a69a" : "#ef5350", fontWeight: 600 }}>{fmt(t.price, 2)}</span>
                  <span style={{ color: "#bbb" }}>{t.size.toFixed(4)}</span>
                  <span style={{ color: "#555", fontSize: 10 }}>{fmtTime(t.time)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="spot-order-form">
          <div className="spot-order-tabs">
            <button className={`spot-order-tab${orderType === "Limit" ? " active" : ""}`} onClick={() => setOrderType("Limit")}>Limit</button>
            <button className={`spot-order-tab${orderType === "Market" ? " active" : ""}`} onClick={() => setOrderType("Market")}>Market</button>
          </div>

          <div className="spot-order-cols">
            <div className="spot-order-col">
              <div className="spot-avail">Available: <strong>{fmt(usdtBal, 2)} USDT</strong> | {pairBase}: <strong>{fmt(btcBal, 6)}</strong></div>
              <input className="spot-order-input" placeholder={orderType === "Market" ? "Market Price" : "Price (USDT)"} value={buyPrice} onChange={e => setBuyPrice(e.target.value)} type="number" disabled={orderType === "Market"} />
              <div className="spot-input-unit">USDT</div>
              <input className="spot-order-input" placeholder={`Amount (${pairBase})`} value={buyAmt} onChange={e => setBuyAmt(e.target.value)} type="number" />
              <div className="spot-input-unit">{pairBase}</div>
              <div className="spot-pct-row">
                {[25, 50, 75, 100].map(p => <button key={p} className="spot-pct-btn" onClick={() => setBuyPct(p)}>{p}%</button>)}
              </div>
              <div className="spot-get-row">Cost: <strong>{buyAmt && (buyPrice || price) ? fmt(buyAmt * (buyPrice || price), 2) : 0} USDT</strong></div>
              <button className="spot-buy-btn" onClick={() => placeOrder("Buy")} disabled={!user}>Buy {pairBase}</button>
            </div>

            <div className="spot-order-col">
              <div className="spot-avail">Available: <strong>{fmt(btcBal, 6)} {pairBase}</strong></div>
              <input className="spot-order-input" placeholder={orderType === "Market" ? "Market Price" : "Price (USDT)"} value={sellPrice} onChange={e => setSellPrice(e.target.value)} type="number" disabled={orderType === "Market"} />
              <div className="spot-input-unit">USDT</div>
              <input className="spot-order-input" placeholder={`Amount (${pairBase})`} value={sellAmt} onChange={e => setSellAmt(e.target.value)} type="number" />
              <div className="spot-input-unit">{pairBase}</div>
              <div className="spot-pct-row">
                {[25, 50, 75, 100].map(p => <button key={p} className="spot-pct-btn" onClick={() => setSellPct(p)}>{p}%</button>)}
              </div>
              <div className="spot-get-row">Receive: <strong>{sellAmt && (sellPrice || price) ? fmt(sellAmt * (sellPrice || price), 2) : 0} USDT</strong></div>
              <button className="spot-sell-btn" onClick={() => placeOrder("Sell")} disabled={!user}>Sell {pairBase}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
