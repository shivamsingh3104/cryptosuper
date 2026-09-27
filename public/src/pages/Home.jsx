import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCryptoData, fmtPrice } from "../hooks/useCryptoData";
import SparklineChart from "../components/SparklineChart";
import { API } from "../config/api";

export default function Home() {
  const navigate = useNavigate();
  const { coins, loading, lastUpdated } = useCryptoData(30000);
  const [homeFees, setHomeFees] = useState({});

  useEffect(() => {
    fetch(`${API}/api/market-fees`)
      .then(r => r.json())
      .then(data => setHomeFees(data || {}))
      .catch(() => {});
  }, []);

  const topCoins = coins.slice(0, 9).map(c => {
    const feePct = homeFees[c.id] || 0;
    c.adminFee = feePct;
    c.ourPrice = c.lastPrice != null ? c.lastPrice * (1 + feePct / 100) : null;
    return c;
  });

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>Trade Crypto Only on <span style={{ color:"#3b82f6" }}>Super App</span></h1>
          <p>
            <span>🔒</span>
            Sign up, trade, and earn up to <strong style={{ color:"#111", marginLeft:4 }}>$380 USDT</strong>
          </p>
          <button className="btn-primary">Start Now</button>
        </div>

        {/* Floating BTC card — live price */}
        <div className="hero-card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {coins[0]?.image && <img src={coins[0].image} width={22} height={22} style={{ borderRadius:"50%" }} alt="BTC"/>}
              <span style={{ fontWeight:700, fontSize:15 }}>BTC/USDT</span>
            </div>
            {coins[0] && (
              <span style={{
                background: coins[0].pos?"#dcfce7":"#fee2e2",
                color: coins[0].pos?"#16a34a":"#dc2626",
                fontSize:12, padding:"2px 8px", borderRadius:20, fontWeight:600
              }}>
                {coins[0].change>=0?"+":""}{coins[0].change.toFixed(2)}%
              </span>
            )}
          </div>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4, fontVariantNumeric:"tabular-nums" }}>
            {coins[0] ? fmtPrice(coins[0].lastPrice) : "Loading..."}
          </div>
          {lastUpdated && (
            <div style={{ fontSize:11, color:"#aaa", marginBottom:10 }}>
              🟢 Live · {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {coins[0]?.sparkline?.length > 2 ? (
            <SparklineChart data={coins[0].sparkline} positive={coins[0].pos} width="100%" height={60}/>
          ) : (
            <svg width="100%" height="60" viewBox="0 0 240 60">
              <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
              </linearGradient></defs>
              <path d="M0,50 C30,45 50,30 80,20 C110,10 130,35 160,15 C190,5 210,20 240,10" fill="none" stroke="#3b82f6" strokeWidth="2.5"/>
              <path d="M0,50 C30,45 50,30 80,20 C110,10 130,35 160,15 C190,5 210,20 240,10 L240,60 L0,60Z" fill="url(#hg)"/>
            </svg>
          )}
        </div>
      </section>

      {/* CORE PRODUCTS */}
      <section className="section-white">
        <div className="two-col">
          <div className="two-col-text">
            <h2 className="section-title">Our Core Products</h2>
            <p className="section-sub">A wide range of trading tools to choose from</p>
            {[
              { icon:"📈", title:"Spot",    desc:"Simple and easy platform for trading" },
              { icon:"📊", title:"Futures", desc:"Perpetual and delivery contracts for trading" },
              { icon:"💰", title:"Earn",    desc:"Simple earning APYs" },
            ].map(p => (
              <div key={p.title} className="product-item">
                <div className="product-icon">{p.icon}</div>
                <div>
                  <div className="product-title">{p.title}</div>
                  <div className="product-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="two-col-visual">
            <div className="card-mock">
              <div style={{ fontSize:13, color:"#888", marginBottom:4 }}>Portfolio Value</div>
              <div style={{ fontSize:24, fontWeight:800, marginBottom:16 }}>$12,840.30</div>
              <svg width="100%" height="80" viewBox="0 0 260 80">
                <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient></defs>
                <path d="M0,70 C40,60 60,50 90,30 C120,10 150,40 180,20 C210,5 230,30 260,15" fill="none" stroke="#3b82f6" strokeWidth="2.5"/>
                <path d="M0,70 C40,60 60,50 90,30 C120,10 150,40 180,20 C210,5 230,30 260,15 L260,80 L0,80Z" fill="url(#pg)"/>
              </svg>
              <div style={{ display:"flex", justifyContent:"space-around", marginTop:16 }}>
                {coins.slice(0,4).map(c => (
                  <div key={c.id} style={{ textAlign:"center" }}>
                    {c.image && <img src={c.image} width={20} height={20} style={{ borderRadius:"50%", display:"block", margin:"0 auto 4px" }} alt={c.name}/>}
                    <div style={{ fontWeight:600, fontSize:12 }}>{c.name}</div>
                    <div style={{ fontSize:10, color: c.pos?"#16a34a":"#dc2626" }}>
                      {c.change>=0?"+":""}{c.change.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAFEGUARDING */}
      <section className="section-light">
        <div className="two-col">
          <div className="two-col-visual">
            <div className="card-mock">
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {["#ef4444","#f59e0b","#22c55e"].map(c=>(
                  <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
                ))}
              </div>
              <div style={{ background:"#3b82f6", borderRadius:8, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ color:"#fff", fontWeight:700, fontSize:13 }}>Reserve Verified ✓</div>
                <div style={{ color:"#bfdbfe", fontSize:11 }}>Proof of funds confirmed</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1, background:"#f3f4f6", borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:11, color:"#888" }}>Withdrawal</div>
                  <div style={{ fontWeight:700, fontSize:13 }}>Instant</div>
                </div>
                <div style={{ flex:1, background:"#f3f4f6", borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:11, color:"#888" }}>Security</div>
                  <div style={{ fontWeight:700, fontSize:13 }}>2FA On</div>
                </div>
              </div>
            </div>
          </div>
          <div className="two-col-text">
            <h2 className="section-title">Safeguarding Your Assets</h2>
            <p className="section-sub">Transparency | Full Withdrawal | Secure Account</p>
            {[
              { icon:"🛡️", title:"Proof of Reserves",              desc:"All assets are backed by real reserves. Fully verifiable and transparent at all times." },
              { icon:"💎", title:"Protected for 100% Withdrawal",  desc:"Withdraw your funds anytime, without delay or restriction." },
              { icon:"🔐", title:"Account Security",               desc:"Advanced 2FA, anti-phishing, and biometric protection to keep your account safe." },
            ].map(item => (
              <div key={item.title} className="product-item">
                <div className="product-icon">{item.icon}</div>
                <div>
                  <div className="product-title">{item.title}</div>
                  <div className="product-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-banner">
        {[
          { value:"1.5+",        label:"Millions of Users Sign Up Globally" },
          { value:"$2,976,617",  label:"24hr Trading Volume" },
          { value:"700+",        label:"Total Virtual Assets" },
        ].map(s => (
          <div key={s.value} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* MARKET OVERVIEW — LIVE */}
      <section className="market-overview">
        <h2>Market Overview</h2>
        <p>
          Popular cryptocurrencies on the market Super App
          {lastUpdated && <span style={{ color:"#aaa", fontSize:12, marginLeft:8 }}>🟢 Live · {lastUpdated.toLocaleTimeString()}</span>}
        </p>

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#aaa" }}>📡 Loading live prices...</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table className="markets-table">
              <thead>
                <tr>
                  {["Name","Last Price","24H Change","Admin %","Our Price","Crypto Markets","Operation"].map(h=>(
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCoins.map((c,i) => (
                  <tr key={c.id||i}>
                    <td>
                      <div className="coin-name-wrap">
                        {c.image
                          ? <img src={c.image} alt={c.name} width={30} height={30} style={{ borderRadius:"50%", flexShrink:0 }}/>
                          : <div className="coin-icon" style={{ background:c.bg }}>{c.icon}</div>
                        }
                        <div>
                          <div className="coin-name">{c.name}</div>
                          <div className="coin-pair">{c.pair}</div>
                        </div>
                      </div>
                    </td>
                    <td className="price-cell" style={{ fontVariantNumeric:"tabular-nums" }}>
                      {fmtPrice(c.lastPrice)}
                    </td>
                    <td>
                      <span className={`change-badge ${c.pos?"change-pos":"change-neg"}`}>
                        {c.change>=0?"+":""}{c.change.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: c.adminFee > 0 ? "#059669" : "#94a3b8", fontSize: "0.85rem" }}>
                      {c.adminFee > 0 ? `+${c.adminFee}%` : "—"}
                    </td>
                    <td style={{ fontWeight: 700, color: "#2563eb", fontVariantNumeric: "tabular-nums" }}>
                      {c.ourPrice != null ? fmtPrice(c.ourPrice) : "—"}
                    </td>
                    <td>
                      <SparklineChart data={c.sparkline} positive={c.pos} width={80} height={32}/>
                    </td>
                    <td><button className="trade-btn">Trade</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:28 }}>
          <button
            onClick={() => navigate("/markets")}
            style={{
              background:"none", border:"1px solid #3b82f6", color:"#3b82f6",
              padding:"10px 32px", borderRadius:8, cursor:"pointer",
              fontSize:14, fontWeight:600, transition:"all 0.15s"
            }}
            onMouseEnter={e=>{ e.target.style.background="#3b82f6"; e.target.style.color="#fff"; }}
            onMouseLeave={e=>{ e.target.style.background="none"; e.target.style.color="#3b82f6"; }}
          >View Full Market →</button>
        </div>
      </section>

      {/* TRADE ANYTIME */}
      <section className="app-section">
        <p className="small-label">Follow Us On</p>
        <h2>Trade anytime, anywhere</h2>
        <p>Try Super App with your iOS, Android, or API</p>

        <div className="device-mockup-wrap">
          {/* Laptop mockup */}
          <div className="laptop-mockup">
            <div className="laptop-screen">
              <div className="laptop-titlebar">
                {["#ef4444","#f59e0b","#22c55e"].map(c=><div key={c} style={{ width:8, height:8, borderRadius:"50%", background:c }}/>)}
                <div className="laptop-urlbar"/>
              </div>
              <div className="laptop-body">
                <div className="laptop-sidebar">
                  {coins.slice(0,5).map((c,i)=>(
                    <div key={c.id||i} className={`laptop-pair${i===0?" active":""}`}>{c.pair}</div>
                  ))}
                </div>
                <div className="laptop-chart-area">
                  <div className="laptop-chart-header">
                    <span className="laptop-symbol">BTC/USDT</span>
                    <span style={{ color: coins[0]?.pos?"#22c55e":"#ef4444", fontSize:9 }}>
                      {coins[0] ? fmtPrice(coins[0].lastPrice) : "—"}
                    </span>
                  </div>
                  {coins[0]?.sparkline?.length > 2
                    ? <SparklineChart data={coins[0].sparkline.slice(-30)} positive={coins[0].pos} width="100%" height={90}/>
                    : <svg width="100%" height="90" viewBox="0 0 260 90"><path d="M0,75 C40,65 80,50 120,30 C160,15 200,40 240,20" fill="none" stroke="#3b82f6" strokeWidth="1.5"/></svg>
                  }
                </div>
                <div className="laptop-order-panel">
                  <div className="laptop-buy-btn">BUY</div>
                  <div className="laptop-sell-btn">SELL</div>
                </div>
              </div>
            </div>
            <div className="laptop-hinge"/>
            <div className="laptop-base"/>
          </div>

          {/* Phone mockup */}
          <div className="phone-mockup">
            <div className="phone-notch"/>
            <div className="phone-content">
              <div className="phone-brand">Super App</div>
              <div className="phone-price" style={{ color:"#fff" }}>
                {coins[0] ? fmtPrice(coins[0].lastPrice) : "—"}
              </div>
              <div style={{ color: coins[0]?.pos?"#22c55e":"#ef4444", fontSize:9, marginBottom:8 }}>
                {coins[0] ? `${coins[0].change>=0?"+":""}${coins[0].change.toFixed(2)}%` : ""}
              </div>
              {coins[0]?.sparkline?.length > 2
                ? <SparklineChart data={coins[0].sparkline.slice(-20)} positive={coins[0].pos} width="100%" height={48}/>
                : <svg width="100%" height="48" viewBox="0 0 100 48"><path d="M0,40 C15,30 30,22 50,14 C70,6 85,18 100,8" fill="none" stroke="#3b82f6" strokeWidth="2"/></svg>
              }
              <div style={{ display:"flex", gap:4, marginTop:8 }}>
                <div className="phone-buy">Buy</div>
                <div className="phone-sell">Sell</div>
              </div>
            </div>
          </div>
        </div>

        <div className="app-btns">
          {[
            { icon:"🍎", label:"App Store",   sub:"Download on the" },
            { icon:"🤖", label:"Google Play", sub:"Get it on" },
            { icon:"🔗", label:"API Trading", sub:"Connect via" },
          ].map(btn => (
            <button key={btn.label} className="app-btn">
              <span style={{ fontSize:22 }}>{btn.icon}</span>
              <div>
                <div className="app-btn-sub">{btn.sub}</div>
                <div className="app-btn-label">{btn.label}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
