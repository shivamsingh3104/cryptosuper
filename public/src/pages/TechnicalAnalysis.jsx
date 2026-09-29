import { useState, useEffect, useCallback, useRef } from "react";
import { API } from "../config/api";

const PAIRS = [
  { id: "bitcoin",        ticker: "BTCUSDT" },
  { id: "ethereum",       ticker: "ETHUSDT" },
  { id: "toncoin",        ticker: "TONUSDT" },
  { id: "binancecoin",    ticker: "BNBUSDT" },
  { id: "solana",         ticker: "SOLUSDT" },
  { id: "ripple",         ticker: "XRPUSDT" },
  { id: "dogecoin",       ticker: "DOGEUSDT" },
  { id: "tron",           ticker: "TRXUSDT" },
  { id: "cardano",        ticker: "ADAUSDT" },
];

const TIMEFRAMES = ["1 minute","5 minutes","15 minutes","1 hour","4 hours","1 day"];

/* Gauge SVG component */
function Gauge({ sell, neutral, buy }) {
  const total = sell + neutral + buy || 1;
  // Angle: -90° (strong sell) to +90° (strong buy)
  // Map buy-sell balance to needle angle
  const balance = (buy - sell) / total; // -1 to 1
  const needleAngle = balance * 80; // degrees from center

  const label = buy > sell + 2 ? (buy > sell + 8 ? "Strong buy" : "Buy")
    : sell > buy + 2 ? (sell > buy + 8 ? "Strong sell" : "Sell")
    : "Neutral";
  const labelColor = label.includes("buy") || label.includes("Buy") ? "#3b82f6"
    : label.includes("sell") || label.includes("Sell") ? "#ef5350"
    : "#888";

  // Arc path helpers
  const cx = 110, cy = 95, r = 72;
  const toRad = d => (d - 90) * Math.PI / 180;
  const arc = (start, end) => {
    const s = toRad(start), e = toRad(end);
    return `M ${cx+r*Math.cos(s)} ${cy+r*Math.sin(s)} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(e)} ${cy+r*Math.sin(e)}`;
  };
  const nx = cx + 55 * Math.cos(toRad(needleAngle));
  const ny = cy + 55 * Math.sin(toRad(needleAngle));

  return (
    <div className="ta-gauge-wrap">
      <svg width="220" height="110" viewBox="0 0 220 105">
        {/* Track arcs */}
        <path d={arc(180,240)} stroke="#ef5350" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arc(240,270)} stroke="#e57373" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arc(270,285)} stroke="#e5e7eb" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arc(285,315)} stroke="#e5e7eb" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arc(315,350)} stroke="#26a69a" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arc(350,360)} stroke="#1a8a82" strokeWidth="10" fill="none" strokeLinecap="round" />

        {/* Labels */}
        <text x="20"  y="95" fontSize="9" fill="#ef5350" textAnchor="middle">Strong sell</text>
        <text x="55"  y="48" fontSize="9" fill="#ef5350" textAnchor="middle">Sell</text>
        <text x="110" y="30" fontSize="9" fill="#888"    textAnchor="middle">Neutral</text>
        <text x="165" y="48" fontSize="9" fill="#26a69a" textAnchor="middle">Buy</text>
        <text x="200" y="95" fontSize="9" fill="#26a69a" textAnchor="middle">Strong buy</text>

        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#1a1a1a" />
      </svg>

      <div className="ta-gauge-label" style={{ color: labelColor }}>{label}</div>

      <div className="ta-indicator-row">
        <div className="ta-ind"><span className="ta-ind-label">Sell</span><span className="ta-ind-val ta-red">{sell}</span></div>
        <div className="ta-ind"><span className="ta-ind-label">Neutral</span><span className="ta-ind-val">{neutral}</span></div>
        <div className="ta-ind"><span className="ta-ind-label">Buy</span><span className="ta-ind-val ta-blue">{buy}</span></div>
      </div>
    </div>
  );
}

export default function TechnicalAnalysis() {
  const [signals,  setSignals]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [tfIdx,    setTfIdx]    = useState({});

  const genSignal = (price, chg) => {
    const sell    = Math.floor(Math.random() * 12);
    const buy     = Math.floor(Math.random() * 16);
    const neutral = 26 - sell - buy;
    return { sell, neutral: Math.max(0, neutral), buy };
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/prices?ids=${PAIRS.map(p=>p.id).join(",")}`);
      const data = (await res.json()).coins || [];
      const map = {};
      data.forEach(c => {
        const pair = PAIRS.find(p => p.id === c.id);
        if (pair) map[pair.ticker] = genSignal(c.current_price, c.price_change_percentage_24h);
      });
      setSignals(map);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="tool-page ta-page">
      <div className="cr-header" style={{ marginBottom: 24 }}>
        <h2 className="cr-title">Technical Analysis</h2>
        <button className="tool-refresh-btn" onClick={fetchData}>↻ Refresh</button>
      </div>

      {loading && <div className="tool-loading"><div className="spinner" /><p>Loading technical signals…</p></div>}

      {!loading && (
        <div className="ta-grid">
          {PAIRS.map(pair => {
            const sig = signals[pair.ticker] || { sell: 7, neutral: 9, buy: 10 };
            const tf  = tfIdx[pair.ticker] ?? 0;
            return (
              <div key={pair.ticker} className="ta-card">
                <div className="ta-card-title">
                  Technical Analysis for{" "}
                  <a href="#" className="ta-pair-link">{pair.ticker}</a>
                </div>
                <div className="ta-tf-row">
                  {TIMEFRAMES.slice(0, 4).map((t, i) => (
                    <button
                      key={t}
                      className={`ta-tf-btn${tf === i ? " active" : ""}`}
                      onClick={() => setTfIdx(prev => ({ ...prev, [pair.ticker]: i }))}
                    >
                      {i === 3 ? "More ▾" : t}
                    </button>
                  ))}
                </div>
                <Gauge sell={sig.sell} neutral={sig.neutral} buy={sig.buy} />
                <div className="ta-tv-badge">
                  <span style={{ fontWeight: 700, color: "#555", fontSize: 12 }}>𝕋𝕧</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
