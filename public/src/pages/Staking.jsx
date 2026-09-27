import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";

const PERIODS = [7, 14, 30, 90, 180, 360];

const FAQS = [
  { q: "What is a Crypto Staking?",                ans: "Crypto staking is the process of locking up your cryptocurrency holdings in a wallet to support the operations of a blockchain network. In exchange, stakers earn rewards, typically a percentage of the staked amount." },
  { q: "How are staking rewards calculated?",       ans: "Staking rewards are calculated based on the Annual Percentage Rate (APR), the amount staked, and the duration of the staking period. Super App offers competitive APR on selected assets." },
  { q: "Can I withdraw my staked assets early?",    ans: "Staked assets are locked for the chosen period. Early withdrawal may not be possible depending on the plan. Please review the terms before staking." },
  { q: "Which cryptocurrencies can I stake?",       ans: "Super App supports staking for BTC, USDT, ETH, USDC, SOL, TRX, XRP, LTC, TON, and DOGE with competitive rates." },
  { q: "Is my staked crypto safe?",                 ans: "Super App employs industry-leading security measures including cold storage, multi-signature wallets, and regular audits to protect your assets." },
];

export default function Staking() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Active Plans");
  const [search, setSearch] = useState("");
  const [faqOpen, setFaqOpen] = useState(null);
  const [selected, setSelected] = useState({});
  const [activePlans, setActivePlans] = useState([]);
  const [stakingRates, setStakingRates] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [balances, setBalances] = useState({});

  const fetchRates = async () => {
    try {
      const res = await fetch(`${API}/api/staking/rates`);
      const data = await res.json();
      if (Array.isArray(data)) setStakingRates(data);
    } catch {}
  };

  const fetchPlans = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API}/api/staking/user/${user.uid}`);
      const data = await res.json();
      if (Array.isArray(data)) setActivePlans(data);
    } catch {}
  };

  const fetchBalance = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API}/api/users/balance?uid=${user.uid}`);
      const data = await res.json();
      if (data) setBalances(data);
    } catch {}
  };

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (user?.uid) { fetchPlans(); fetchBalance(); }
  }, [user]);

  const filtered = stakingRates.filter(p =>
    !search.trim() || p.symbol?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChoose = async (plan) => {
    if (!isLoggedIn) { navigate("/login", { state: { from: "/earn/staking" } }); return; }
    const periodIdx = selected[plan.coinId] ?? 5;
    const period = PERIODS[periodIdx];
    const amount = amounts[plan.coinId];
    if (!amount || Number(amount) <= 0) {
      setMsg("Enter a valid amount to stake");
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/api/staking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          coinId: plan.coinId,
          symbol: plan.symbol,
          name: plan.name,
          image: `https://assets.coingecko.com/coins/images/1/large/${plan.coinId}.png`,
          amount: Number(amount),
          period,
          rate: plan.rate,
        })
      });
      const data = await res.json();
      if (data.error) {
        setMsg(data.error);
      } else {
        setMsg(data.message);
        fetchPlans();
        setAmounts(s => ({ ...s, [plan.coinId]: "" }));
      }
    } catch (err) {
      setMsg("Failed to create staking plan");
    }
    setLoading(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this staking plan?")) return;
    try {
      const res = await fetch(`${API}/api/staking/cancel/${id}`, { method: "PUT" });
      const data = await res.json();
      if (data.error) { setMsg(data.error); } else { setMsg(data.message); fetchPlans(); }
    } catch { setMsg("Failed to cancel"); }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleClaim = async (id) => {
    try {
      const res = await fetch(`${API}/api/staking/claim/${id}`, { method: "PUT" });
      const data = await res.json();
      if (data.error) { setMsg(data.error); } else { setMsg(data.message); fetchPlans(); }
    } catch { setMsg("Failed to claim"); }
    setTimeout(() => setMsg(null), 3000);
  };

  const getCoinImage = (coinId) =>
    `https://assets.coingecko.com/coins/images/1/large/${coinId}.png`;

  const getBalance = (plan) => {
    if (plan.symbol === "USDT" || plan.symbol === "USDC") return balances.balance || 0;
    if (plan.coinId === "bitcoin") return balances.BTCBalance || 0;
    return balances[plan.symbol + "Balance"] || 0;
  };

  const activeList = activePlans.filter(p => p.status === "active");
  const historyList = activePlans.filter(p => p.status !== "active");

  return (
    <div className="staking-page">
      {msg && <div className="staking-toast">{msg}</div>}

      <div className="staking-hero">
        <div className="staking-hero-content">
          <h1 className="staking-hero-title">Crypto Staking</h1>
          <p className="staking-hero-desc">
            Super App Crypto Staking is a simple yet effective way to earn rewards. It allows you to gain
            profit by staking your crypto assets. Select the best staking plan for you based on its rate,
            lock-up period, and staking amount, and start earning today.
          </p>
        </div>
        <div className="staking-hero-visual">
          <div className="staking-pct-badge">18.64%</div>
          <div className="staking-vault">
            <div className="sv-body">
              <div className="sv-dial" />
              <div className="sv-handle" />
            </div>
            <div className="sv-coins">
              <div className="sv-coin sv-btc">₿</div>
              <div className="sv-coin sv-eth">Ξ</div>
            </div>
          </div>
        </div>
      </div>

      <div className="staking-section">
        <h2 className="staking-section-title">Plans</h2>

        <div className="staking-top-bar">
          <div className="staking-plan-tabs">
            {["Active Plans","History"].map(t => (
              <button key={t} className={`sp-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          <div className="staking-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="staking-search" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="staking-table-wrap">
          <table className="staking-table">
            <thead>
              <tr>
                <th className="st-th-asset">Assets</th>
                <th className="st-th-period">Period</th>
                <th>Rate</th>
                <th>Deposit Range</th>
                <th>Available</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(plan => (
                <tr key={plan.coinId} className="st-row">
                  <td className="st-asset-cell">
                    <img src={getCoinImage(plan.coinId)} width={32} height={32} alt={plan.symbol} style={{ borderRadius:"50%", flexShrink:0 }} onError={e => e.target.style.display="none"} />
                    <div>
                      <div className="st-symbol">{plan.symbol}</div>
                      <div className="st-name">{plan.name}</div>
                    </div>
                  </td>
                  <td className="st-period-cell">
                    {PERIODS.map((p, i) => (
                      <button
                        key={p}
                        className={`st-period-btn${(selected[plan.coinId] ?? 5) === i ? " active" : ""}`}
                        onClick={() => setSelected(s => ({ ...s, [plan.coinId]: i }))}
                      >
                        <span className="st-period-num">{p}</span>
                        <span className="st-period-unit">Days</span>
                      </button>
                    ))}
                  </td>
                  <td className="st-rate-cell">{plan.rate?.toFixed(2)}%</td>
                  <td className="st-range-cell">{plan.minDeposit || "0.001"} - {plan.maxDeposit || "100000"} {plan.symbol}</td>
                  <td className="st-bal-cell">
                    <span className="st-avail-bal">{Number(getBalance(plan)).toFixed(6)}</span>
                  </td>
                  <td>
                    <input
                      className="st-amount-input"
                      type="number"
                      placeholder="Amount"
                      value={amounts[plan.coinId] || ""}
                      onChange={e => setAmounts(s => ({ ...s, [plan.coinId]: e.target.value }))}
                      min={0}
                      max={getBalance(plan)}
                      step="any"
                    />
                  </td>
                  <td>
                    <button className="st-choose-btn" onClick={() => handleChoose(plan)} disabled={loading}>
                      {loading ? "Processing..." : "Choose Plan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="staking-page-row">
          <button className="staking-pg-btn active">1</button>
        </div>

        <h2 className="staking-section-title" style={{ marginTop: 40 }}>Your Active Plans</h2>
        <div className="staking-active-wrap">
          <table className="staking-active-table">
            <thead>
              <tr>
                <th>Assets</th><th>Plan</th><th>Deposited</th>
                <th>Realtime Profit</th><th>Open Time</th><th>Close Time</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "Active Plans" ? activeList : historyList).length === 0 ? (
                <tr>
                  <td colSpan={8} className="st-no-records">
                    <div className="st-no-inner">
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                      </svg>
                      <p>No Records</p>
                    </div>
                  </td>
                </tr>
              ) : (tab === "Active Plans" ? activeList : historyList).map(ap => (
                <tr key={ap.id} className="st-active-row">
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <img src={ap.image || getCoinImage(ap.coinId)} width={24} height={24} style={{ borderRadius:"50%" }} alt={ap.symbol} />
                      {ap.symbol}
                    </div>
                  </td>
                  <td>{ap.period} Days</td>
                  <td>{ap.amount}</td>
                  <td className="tc-green">{ap.realtimeProfit?.toFixed(8) || "0.00000000"}</td>
                  <td>{new Date(ap.startDate?.toDate?.() || ap.startDate).toLocaleString()}</td>
                  <td>{new Date(ap.endDate?.toDate?.() || ap.endDate).toLocaleDateString()}</td>
                  <td><span className={`st-status-${ap.status}`}>{ap.status}</span></td>
                  <td>
                    {ap.status === "active" && new Date(ap.endDate?.toDate?.() || ap.endDate).getTime() < Date.now() ? (
                      <button className="st-claim-btn" onClick={() => handleClaim(ap.id)}>Claim</button>
                    ) : ap.status === "active" ? (
                      <button className="st-cancel-btn" onClick={() => handleCancel(ap.id)}>Cancel</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="staking-faq-section">
        <h2 className="staking-faq-title">Any questions?</h2>
        <div className="staking-faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`staking-faq-item${faqOpen === i ? " open" : ""}`}>
              <button className="staking-faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <span>{f.q}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transform: faqOpen === i ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {faqOpen === i && <div className="staking-faq-a">{f.ans}</div>}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .staking-toast {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #111; color: #fff; padding: 12px 24px;
          border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          border-left: 4px solid #3b82f6; font-size: 14px;
        }
        .st-amount-input {
          width: 100px; padding: 6px 10px; border-radius: 6px;
          border: 1px solid #e5e7eb; background: #fff; color: #111;
          font-size: 13px; outline: none;
        }
        .st-amount-input:focus { border-color: #3b82f6; }
        .st-bal-cell { padding: 14px; white-space: nowrap; }
        .st-avail-bal { font-size: 13px; color: #374151; font-weight: 500; }
        .st-claim-btn {
          background: #26a69a; color: #fff; border: none;
          padding: 6px 16px; border-radius: 6px; cursor: pointer;
          font-size: 13px; font-weight: 600;
        }
        .st-claim-btn:hover { background: #1c8a7a; }
        .st-status-active { color: #26a69a; text-transform: capitalize; }
        .st-status-completed { color: #3b82f6; text-transform: capitalize; }
        .st-status-claimed { color: #f39c12; text-transform: capitalize; }
        .st-status-cancelled { color: #ef5350; text-transform: capitalize; }
      `}</style>
    </div>
  );
}
