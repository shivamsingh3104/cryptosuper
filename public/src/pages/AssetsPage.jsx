import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";
import authedFetch from "../utils/authedFetch";

const COINS = [
  { id: "bitcoin", symbol: "BTC", field: "BTCBalance" },
  { id: "ethereum", symbol: "ETH", field: "ETHBalance" },
  { id: "solana", symbol: "SOL", field: "SOLBalance" },
  { id: "ripple", symbol: "XRP", field: "XRPBalance" },
  { id: "cardano", symbol: "ADA", field: "ADABalance" },
  { id: "dogecoin", symbol: "DOGE", field: "DOGEBalance" },
  { id: "tron", symbol: "TRX", field: "TRXBalance" },
  { id: "litecoin", symbol: "LTC", field: "LTCBalance" },
  { id: "polkadot", symbol: "DOT", field: "DOTBalance" },
  { id: "chainlink", symbol: "LINK", field: "LINKBalance" },
];

const s = {
  page: { minHeight: "100vh", background: "#f6f8fb", padding: 24 },
  card: { maxWidth: 720, margin: "0 auto", background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, color: "#111" },
  hideBtn: { background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 },
  totalUsd: { fontSize: 36, fontWeight: 800, color: "#111", marginBottom: 4 },
  totalBtc: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  disclaimer: { fontSize: 12, color: "#9ca3af", marginBottom: 16 },
  actionRow: { display: "flex", gap: 12, marginBottom: 16 },
  actionBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 12, background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151" },
  divider: { height: 1, background: "#e5e7eb", marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 },
  assetRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  assetLeft: { display: "flex", alignItems: "center", gap: 12 },
  coinBadge: { width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", color: "#4b5563" },
  coinSymbol: { fontSize: 14, fontWeight: 600 },
  coinAmount: { fontSize: 12, color: "#9ca3af" },
  assetRight: { textAlign: "right" },
  usdValue: { fontSize: 14, fontWeight: 700 },
  coinPrice: { fontSize: 12, color: "#9ca3af" },
  breakdownRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  bLabel: { fontSize: 14, fontWeight: 600, color: "#111" },
  bPct: { fontSize: 12, color: "#6b7280" },
  bVal: { fontSize: 14, fontWeight: 700, color: "#111" },
  empty: { textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 14 },
};

export default function AssetsPage() {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [allBalances, setAllBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let balanceDone = false, pricesDone = false;
    const done = () => { if (balanceDone && pricesDone) setLoading(false); };
    authedFetch(`/api/users/balance`).then(r => r.json()).then(d => {
      console.log("ASSETS BALANCE:", d);
      setAllBalances(d || {});
      balanceDone = true; done();
    }).catch(() => { balanceDone = true; done(); });
    fetch(`${API}/api/price?ids=${COINS.map(c => c.id).join(",")}`).then(r => r.json()).then(d => {
      console.log("ASSETS PRICES:", d);
      setPrices(d || {});
      pricesDone = true; done();
    }).catch(e => { console.error("ASSETS PRICE ERROR:", e); pricesDone = true; done(); });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(() => {
      authedFetch(`/api/users/balance`)
        .then(r => r.json())
        .then(d => setAllBalances(d || {}))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  if (authLoading) return <div style={{...s.page, display:"flex", alignItems:"center", justifyContent:"center"}}><div style={{color:"#6b7280"}}>Loading...</div></div>;
  if (!isLoggedIn) {
    navigate("/login", { state: { from: "/assets" }, replace: true });
    return null;
  }

  const usdBalance = allBalances.balance || 0;
  const assets = COINS.map(c => ({
    ...c,
    amount: allBalances[c.field] || 0,
    usdValue: (allBalances[c.field] || 0) * (prices[c.id]?.usd || 0),
  }));
  const totalUsdValue = usdBalance + assets.reduce((sum, a) => sum + a.usdValue, 0);
  // Live BTC price — pehle yahan `/ 80000` hardcode tha, isliye ye line real BTC
  // price ke upar/down hone par bhi galat rehti. `prices` upar CoinGecko se aata
  // hai, isliye usi ka istemal karte hain.
  const btcPrice = prices.bitcoin?.usd || 0;
  const bal = hideBalance ? "***" : totalUsdValue.toFixed(2);
  const hasAssets = assets.filter(a => a.amount > 0).length > 0;

  const refetch = () => {
    if (!user?.uid) return;
    authedFetch(`/api/users/balance`).then(r => r.json()).then(d => {
      console.log("ASSETS REFETCH:", d);
      setAllBalances(d || {});
    }).catch(() => {});
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <span style={s.title}>Assets Overview</span>
          <button style={s.hideBtn} onClick={() => setHideBalance(h => !h)}>
            {hideBalance
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
            }
          </button>
        </div>

        <div style={s.totalUsd}>{loading ? "Loading..." : `${bal} USD`}</div>
        <div style={s.totalBtc}>≈ {hideBalance || loading || !totalUsdValue || !btcPrice ? "***" : (totalUsdValue / btcPrice).toFixed(6)} BTC</div>
        <p style={s.disclaimer}>*Data may be delayed. <span style={{color:'#2563eb',cursor:'pointer',textDecoration:'underline'}} onClick={refetch}>Refresh</span></p>

        <div style={s.actionRow}>
          {/* Deposit button hata diya — admin hi wallet me credit karta hai. */}
          <button style={s.actionBtn} onClick={() => navigate("/profile/wallet")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Withdraw
          </button>
        </div>

        <div style={s.divider} />

        <div>
          <div style={s.sectionTitle}>Your Assets</div>
          {!hasAssets && !loading && <div style={s.empty}>No assets yet. Start trading or deposit funds.</div>}
          {assets.filter(a => a.amount > 0).map(a => (
            <div key={a.id} style={s.assetRow}>
              <div style={s.assetLeft}>
                <div style={s.coinBadge}>{a.symbol}</div>
                <div>
                  <div style={s.coinSymbol}>{a.symbol}</div>
                  <div style={s.coinAmount}>{a.amount.toFixed(6)} {a.symbol}</div>
                </div>
              </div>
              <div style={s.assetRight}>
                <div style={s.usdValue}>${a.usdValue.toFixed(2)}</div>
                <div style={s.coinPrice}>@ ${(prices[a.id]?.usd || 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{...s.divider, marginTop:16}} />

        {[
          { label: "Spot",    pct: totalUsdValue > 0 ? ((usdBalance / totalUsdValue) * 100).toFixed(1) + "%" : "0%", val: usdBalance },
          { label: "Margin",  pct: "0.0%" },
          { label: "Futures", pct: "0.0%" },
          { label: "Earn",    pct: "0.0%" },
        ].map(item => (
          <div key={item.label} style={s.breakdownRow}>
            <div>
              <div style={s.bLabel}>{item.label}</div>
              <div style={s.bPct}>{item.pct}</div>
            </div>
            <div style={s.bVal}>{hideBalance ? "***" : `$${item.val !== undefined ? item.val.toFixed(2) : "0.00"}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
