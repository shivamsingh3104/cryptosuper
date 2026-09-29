import React, { useMemo, useState, useEffect, useRef } from "react";
import { useCryptoData, fmtPrice } from "../hooks/useCryptoData";
import useBalances from "../hooks/useBalances";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";

const ExchangePage = () => {
  const { user } = useAuth();
  const { coins, loading, error, lastUpdated } = useCryptoData(30000);
  const [sendId, setSendId] = useState("bitcoin");
  const [receiveId, setReceiveId] = useState("ethereum");
  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const wrapperRef = useRef(null);

  const [step, setStep] = useState("calculator");
  const [submitting, setSubmitting] = useState(false);
  const [swapResult, setSwapResult] = useState(null);
  const [mySwaps, setMySwaps] = useState([]);
  const [rawBalances, setRawBalances] = useState({});
  const [wallets, setWallets] = useState([]);
  const localOverride = useRef(false);

  // Balance ab poll + tab-focus par refresh hota hai, aur error alag se
  // expose hota hai. Pehle ek hi baar fetch hota tha aur failure par page
  // "0.000000 BTC" dikhata tha — jo galat/galat-confident dikhna hai.
  const {
    balances: fetchedBalances,
    loading: balancesLoading,
    error: balancesError,
    refresh: refreshBalances,
  } = useBalances(user?.uid);

  // Default send coin BTC tha. Zyadatar users ke paas BTC nahi hota (sirf
  // USDT), to page kholte hi "Available balance: 0 BTC" dikhta tha — jabki
  // unke paas paisa tha. Ab jab balance load ho jaye, aur current default coin
  // ke paas kuch nahi hai, to us coin par switch kar dete hain jisme user ke
  // paas actually balance hai (USDT ko preference).
  //
  // Ye sirf EK baar chalta hai (autoPicked ref) — taaki user apna manually
  // chuna hua coin baad me badal sake.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (autoPicked.current || balancesLoading || !fetchedBalances) return;
    if (!coins.length) return;

    // USDT ka field lowercase "balance" hota hai, isliye `endsWith("Balance")`
    // se wo miss ho jata tha — use alag se include karna zaroori hai.
    const held = Object.keys(fetchedBalances)
      .filter((k) => k.endsWith("Balance") && k !== "USDTBalance")
      .map((k) => [k.replace("Balance", "").toUpperCase(), Number(fetchedBalances[k]) || 0])
      .filter(([, v]) => v > 0);
    if (Number(fetchedBalances.balance) > 0) held.unshift(["USDT", Number(fetchedBalances.balance)]);
    if (!held.length) { autoPicked.current = true; return; }

    // Jo coin already chuna hai usme balance hai to haath nahi lagate.
    const currentSym = coins.find((c) => c.id === sendId)?.symbol?.toUpperCase();
    const currentHeld =
      currentSym === "USDT"
        ? Number(fetchedBalances.balance) > 0
        : held.some(([s]) => s === currentSym);
    if (currentHeld) { autoPicked.current = true; return; }

    // Preference: USDT, warna jis coin ki value sabse zyada ho.
    const pick = held.find(([s]) => s === "USDT")
      || held.slice().sort((a, b) => b[1] - a[1])[0];
    const target = coins.find((c) => (c.symbol || "").toUpperCase() === pick[0]);
    if (target) {
      autoPicked.current = true;
      setSendId(target.id);
      if (target.id === receiveId) setReceiveId(coins.find((c) => c.id !== target.id)?.id || receiveId);
    }
  }, [fetchedBalances, balancesLoading, coins, sendId, receiveId]);


  // Swap ke baad optimistic local update hota hai (setRawBalances) — usse
  // turant server value na over-write ho, isliye local state hi rahe aur
  // agla poll server ko resync kar deta hai.
  useEffect(() => {
    if (!localOverride.current) setRawBalances(fetchedBalances);
  }, [fetchedBalances]);

  const getBalance = (symbol) => {
    if (!symbol) return 0;
    const s = symbol.toUpperCase();
    if (s === "USDT") return rawBalances.balance || 0;
    const specific = rawBalances[s + "Balance"];
    if (specific !== undefined && specific !== null) return specific;
    return 0;
  };

  const sendCoin = useMemo(() => coins.find((c) => c.id === sendId), [coins, sendId]);
  const receiveCoin = useMemo(() => coins.find((c) => c.id === receiveId), [coins, receiveId]);

  // Balance ki jagah dikhane wala ek hi helper. Pehle JSX me `sendCoin?.name ||
  // "BTC"` likha tha — jab CoinGecko load nahi hota to sendCoin undefined hota
  // aur `getBalance(undefined)` 0 return karke screen par ek bilkul legit dikhne
  // wala "0.000000 BTC" print ho jata tha, jabki user ke paas balance tha ya
  // balance load hi nahi hua tha. Ab uncertain state me hum "—" ya error
  // dikhate hain, kabhi galat number nahi.
  const balanceLabel = (coin) => {
    if (balancesError) {
      return (
        <button
          type="button"
          onClick={refreshBalances}
          style={{ background: "none", border: 0, color: "#dc2626", cursor: "pointer", font: "inherit" }}
          title="Click to retry"
        >
          Balance failed to load — retry
        </button>
      );
    }
    if (!coin) return <span style={{ opacity: 0.5 }}>—</span>;
    if (balancesLoading) return <span style={{ opacity: 0.5 }}>loading…</span>;
    const value = getBalance(coin.name);
    return (
      <>
        {value.toLocaleString(undefined, { maximumFractionDigits: 8 })} {coin.name}
      </>
    );
  };

  const sendPrice = sendCoin?.lastPrice || 0;
  const receivePrice = receiveCoin?.lastPrice || 0;

  const rate = useMemo(() => {
    if (!sendPrice || !receivePrice) return 0;
    return sendPrice / receivePrice;
  }, [sendPrice, receivePrice]);

  useEffect(() => {
    const n = Number(sendAmount);
    if (!Number.isFinite(n) || n <= 0 || !rate) {
      setReceiveAmount("");
      return;
    }
    const result = n * rate;
    setReceiveAmount(
      Number.isInteger(result)
        ? String(result)
        : result.toFixed(8).replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1")
    );
  }, [sendAmount, rate]);

  const amountToPay = useMemo(() => {
    const n = Number(sendAmount);
    if (!Number.isFinite(n) || n <= 0 || !sendPrice) return 0;
    return n * sendPrice;
  }, [sendAmount, sendPrice]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/wallets`)
      .then(res => res.json())
      .then(data => setWallets(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    fetch(`${API}/api/swap/user/${user.uid}`)
      .then(res => res.json())
      .then(data => setMySwaps(data || []))
      .catch(() => {});
  }, [user?.uid, swapResult]);

  const activeCoins = useMemo(() => {
    const preferred = ["bitcoin", "ethereum", "usd-coin", "tether", "binancecoin", "solana", "ripple", "dogecoin", "toncoin", "tron"];
    const score = (id) => {
      const idx = preferred.indexOf(id);
      return idx === -1 ? 999 : idx;
    };
    return coins.slice().sort((a, b) => score(a.id) - score(b.id));
  }, [coins]);

  const togglePair = () => {
    const temp = sendId;
    setSendId(receiveId);
    setReceiveId(temp);
  };

  const selectCoin = (side, id) => {
    if (side === "send") setSendId(id);
    else setReceiveId(id);
    setOpenMenu(null);
  };

  const currentRateLabel = useMemo(() => {
    if (!sendCoin || !receiveCoin) return "—";
    const value = rate ? Number(rate.toFixed(8)).toLocaleString("en-US") : "—";
    return `1 ${sendCoin.name} ≈ ${value} ${receiveCoin.name}`;
  }, [sendCoin, receiveCoin, rate]);

  const commission = useMemo(() => {
    const n = Number(sendAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n * 0.0025;
  }, [sendAmount]);

  const canExchange = Number(sendAmount) > 0 && sendCoin && receiveCoin && sendCoin.id !== receiveCoin.id;

  const handleSwap = async () => {
    if (!user?.uid) {
      alert("Please login first");
      return;
    }
    const bal = getBalance(sendCoin?.name);
    if (Number(sendAmount) > bal) {
      alert(`Insufficient ${sendCoin?.name} balance`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/swap/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          fromCurrency: sendCoin?.name || "",
          toCurrency: receiveCoin?.name || "",
          fromAmount: Number(sendAmount),
          toAmount: Number(receiveAmount) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setSwapResult(data);
        setStep("success");
        // sirf fromAmount escrow hota hai; toAmount admin approval pe credit hoga
        const fromKey = sendCoin?.name === "USDT" ? "balance" : sendCoin?.name + "Balance";
        // Turant UI update (optimistic) — agle poll tak local value rahe, warna
        // pending server state wapas purana balance dikha degi.
        localOverride.current = true;
        setRawBalances(prev => ({
          ...prev,
          [fromKey]: Math.max(0, (prev[fromKey] || 0) - Number(sendAmount))
        }));
        // 30s baad override chhod do taaki server value wapas authoritative ho.
        setTimeout(() => { localOverride.current = false; refreshBalances(); }, 30000);
      } else {
        alert("Error: " + (data.error || "Something went wrong"));
      }
    } catch (err) {
      alert("Server error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const dropdown = (side) => {
    const selectedId = side === "send" ? sendId : receiveId;
    const selectedCoin = coins.find((c) => c.id === selectedId);
    const isOpen = openMenu === side;

    return (
      <div className="swap-dropdown-wrap">
        <button
          type="button"
          onClick={() => setOpenMenu(isOpen ? null : side)}
          className="swap-dropdown-btn"
        >
          <div className="swap-dropdown-left">
            <div className="swap-coin-badge" style={{ background: selectedCoin?.bg || "#f1f5f9" }}>
              {selectedCoin?.image ? (
                <img src={selectedCoin.image} alt={selectedCoin.fullName} className="swap-coin-img" />
              ) : (
                <span className="swap-coin-fallback">{selectedCoin?.icon || "●"}</span>
              )}
            </div>
            <div className="swap-dropdown-text">
              <span className="swap-dropdown-name">
                <span className="swap-dropdown-full">{selectedCoin?.fullName || "Select coin"}</span>{" "}
                <span className="swap-dropdown-symbol">{selectedCoin?.name || ""}</span>
              </span>
            </div>
          </div>
          <div className={`swap-caret ${isOpen ? "is-open" : ""}`}>▾</div>
        </button>

        {isOpen && (
          <div className="swap-dropdown-menu">
            {activeCoins.map((coin) => {
              const active = coin.id === selectedId;
              return (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => selectCoin(side, coin.id)}
                  className={`swap-dropdown-item ${active ? "is-active" : ""}`}
                >
                  <div className="swap-item-left">
                    <div className="swap-coin-badge" style={{ background: coin.bg }}>
                      {coin.image ? (
                        <img src={coin.image} alt={coin.fullName} className="swap-coin-img" />
                      ) : (
                        <span className="swap-coin-fallback">{coin.icon}</span>
                      )}
                    </div>
                    <div className="swap-item-title">
                      <span className="swap-item-full">{coin.fullName}</span>{" "}
                      <span className="swap-item-symbol">{coin.name}</span>
                    </div>
                  </div>
                  <div className="swap-item-price">{coin?.lastPrice ? fmtPrice(coin.lastPrice).replace("$", "") : "0.0"}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const faqData = [
    {
      q: "How to exchange cryptocurrency?",
      a: "Choose the coin you want to send, choose the coin you want to receive, enter the amount, and the system will calculate the receiving amount using the live market rate."
    },
    {
      q: "At what rate does cryptocurrency exchange occur?",
      a: "The conversion is calculated from live market prices fetched from CoinGecko. The displayed rate updates automatically as market data changes."
    },
    {
      q: "How is the conversion fee calculated?",
      a: "The sample fee in this interface is 0.25% of the sending amount. You can change this logic later if your business rules need a different fee."
    },
    {
      q: "What are the minimum and maximum transaction amounts?",
      a: "Minimum and maximum limits depend on the selected asset and your business rules. In this demo, the interface only blocks empty or zero amounts, while your backend can enforce exact limits."
    },
    {
      q: "Is registration or KYC required?",
      a: "That depends on your platform policy and local compliance rules. You can connect this page to your auth or verification flow if needed."
    },
    {
      q: "How long does the exchange process take?",
      a: "In this demo, the quote updates instantly on the client. A real exchange normally completes in a few steps after backend validation and blockchain confirmation."
    },
    {
      q: "Which payment systems do we support?",
      a: "This screen is focused on crypto-to-crypto exchange. If you want fiat rails, you can connect card, bank transfer, or payment gateway support later."
    },
    {
      q: "How to deposit and withdraw funds?",
      a: "Deposits and withdrawals are usually handled in your wallet or account section. This exchange screen only handles the conversion preview and amount calculation."
    },
    {
      q: "Which cryptocurrencies can be exchanged?",
      a: "The dropdown is built from the live CoinGecko list returned by your hook, so the available coins depend on the assets you load into the app."
    },
  ];

  return (
    <div className="swap-page">
      <div className="swap-hero">
        <div className="swap-hero-inner">
          <h1 className="swap-hero-title">Cryptocurrency Exchange</h1>
          <p className="swap-hero-subtitle">
            In this section you can quickly exchange currency. To do this, assets must be on the trading balance.
          </p>
        </div>
      </div>

      <div className="swap-content">
        <div className="swap-card" ref={wrapperRef}>
          {step === "calculator" && (
            <>
              <div className="swap-tabs">
                <button className={`swap-tab ${step === "calculator" ? "active" : ""}`} onClick={() => setStep("calculator")}>Exchange</button>
                <button className={`swap-tab ${step === "history" ? "active" : ""}`} onClick={() => setStep("history")}>History</button>
              </div>

              <div className="swap-grid">
                <div className="swap-col">
                  {dropdown("send")}

                  <div className="swap-balance-row">
                    <span>Available balance:</span>
                    <span
                      className="swap-balance-value"
                      style={{ cursor: sendCoin ? "pointer" : "default" }}
                      onClick={() => {
                        if (sendCoin) setSendAmount(getBalance(sendCoin.name).toString());
                      }}
                    >
                      {balanceLabel(sendCoin)}
                    </span>
                  </div>

                  <input
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="I'm sending"
                    inputMode="decimal"
                    className="swap-input"
                  />

                  <div className="swap-label">Current rate:</div>
                  <div className="swap-rate">{currentRateLabel}</div>

                  <div className={`swap-limit ${Number(sendAmount) > 0 && Number(sendAmount) < 0.00001344 ? "show" : ""}`}>
                    Exchange amount below the minimum 0.00001344
                  </div>
                </div>

                <div className="swap-center">
                  <button type="button" onClick={togglePair} className="swap-btn" aria-label="Swap currencies">
                    ⇄
                  </button>
                </div>

                <div className="swap-col">
                  {dropdown("receive")}

                  <div className="swap-balance-row right">
                    <span>Available balance:</span>
                    <span className="swap-balance-value">{balanceLabel(receiveCoin)}</span>
                  </div>

                  <input
                    value={receiveAmount}
                    readOnly
                    placeholder="I'm receiving"
                    className="swap-input"
                  />

                  <div className="swap-side-meta">
                    <div>
                      <div className="swap-label">Rate for 24h.</div>
                      <div className={`swap-change ${sendCoin?.change >= 0 ? "positive" : "negative"}`}>
                        {sendCoin?.change ? `${sendCoin.change.toFixed(2)}%` : "0.00%"}
                      </div>
                    </div>
                    <div className="swap-fee">Commission: {commission.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {canExchange && (
                <div className="swap-payment-section">
                  <div className="swap-pay-amount">
                    You are exchanging: <strong>{sendAmount} {sendCoin?.name}</strong> 
                    {sendPrice > 0 && <span className="swap-usd-hint"> ≈ ${(Number(sendAmount) * sendPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</span>}
                  </div>
                  <div className="swap-pay-amount" style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "-0.5rem" }}>
                    You will receive: <strong>{receiveAmount || "0"} {receiveCoin?.name}</strong>
                  </div>

                  <div className="swap-actions">
                    <button
                      type="button"
                      disabled={!canExchange || submitting}
                      onClick={handleSwap}
                      className="swap-exchange-btn"
                    >
                      {submitting ? "Swapping..." : `Swap Now`}
                    </button>
                  </div>
                </div>
              )}

              {!canExchange && (
                <div className="swap-actions">
                  <button type="button" disabled className="swap-exchange-btn">
                    Enter amount to swap
                  </button>
                </div>
              )}

              {error && <div className="swap-status error">{error}</div>}
              {loading && <div className="swap-status">Loading live market data...</div>}
              {lastUpdated && <div className="swap-updated">Updated: {lastUpdated.toLocaleString()}</div>}
            </>
          )}

          {step === "success" && swapResult && (
            <div className="swap-success">
              <div className="swap-success-icon">✅</div>
              <h2>Swap Completed!</h2>
              <p className="swap-success-msg">
                {swapResult.message || "Swap successful!"}
              </p>
              <div className="swap-hash-key-box">
                <label>Transaction ID:</label>
                <div className="swap-hash-value">
                  <code>{swapResult.hashKey}</code>
                  <button onClick={() => { navigator.clipboard.writeText(swapResult.hashKey); alert("Copied!"); }}>
                    Copy
                  </button>
                </div>
              </div>
              <p className="swap-status-info">Status: <span className="badge-completed">Completed</span></p>
              <button className="swap-back-btn" onClick={() => { setStep("calculator"); setSwapResult(null); setSendAmount(""); setReceiveAmount(""); }}>
                New Swap
              </button>
            </div>
          )}

          {step === "history" && (
            <div className="swap-claim-section">
              <div className="swap-tabs">
                <button className="swap-tab" onClick={() => setStep("calculator")}>Exchange</button>
                <button className="swap-tab active" onClick={() => setStep("history")}>History</button>
              </div>

              <div className="swap-history">
                <h3>My Swap History</h3>
                {mySwaps.length === 0 ? (
                  <p className="swap-history-empty">No swaps yet.</p>
                ) : (
                  <table className="swap-history-table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySwaps.map(s => (
                        <tr key={s.id}>
                          <td>{s.fromCurrency}</td>
                          <td>{s.toCurrency}</td>
                          <td>{s.fromAmount} → {s.toAmount}</td>
                          <td>
                            <span className={`badge-${s.status}`}>{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {step !== "history" && step !== "calculator" && step !== "success" && (
            <div className="swap-tabs" style={{ padding: "1rem" }}>
              <button className="swap-tab" onClick={() => setStep("calculator")}>Exchange</button>
              <button className="swap-tab active" onClick={() => setStep("history")}>History</button>
            </div>
          )}
        </div>

        <div className="swap-faq-section">
          <h2 className="swap-faq-title">Any questions?</h2>
          <div className="swap-faq-list">
            {faqData.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <div key={item.q} className="swap-faq-item">
                  <button type="button" className="swap-faq-question" onClick={() => setOpenFaq(open ? null : idx)}>
                    <span>{item.q}</span>
                    <span className={`swap-faq-arrow ${open ? "open" : ""}`}>▾</span>
                  </button>
                  {open && <div className="swap-faq-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .swap-payment-section {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
        }
        .swap-pay-amount {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #1e293b;
        }
        .swap-pay-amount strong {
          color: #2563eb;
        }
        .swap-wallet-select {
          margin-bottom: 1rem;
        }
        .swap-wallet-select label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin-bottom: 0.4rem;
        }
        .swap-wallet-select select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          background: white;
          outline: none;
        }
        .swap-wallet-select select:focus {
          border-color: #2563eb;
        }
        .swap-wallet-detail {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          font-size: 0.85rem;
        }
        .swap-wallet-detail p {
          margin: 0.3rem 0;
        }
        .swap-wallet-detail code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 0.3rem;
          font-size: 0.8rem;
          word-break: break-all;
        }
        .hash-highlight {
          background: #fef3c7 !important;
          color: #92400e;
          font-weight: 700;
        }
        .swap-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .swap-tab {
          padding: 0.5rem 1.2rem;
          border: 2px solid #e2e8f0;
          border-radius: 2rem;
          background: white;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          color: #64748b;
        }
        .swap-tab.active {
          border-color: #2563eb;
          color: #2563eb;
          background: #eff6ff;
        }
        .swap-success {
          text-align: center;
          padding: 2rem 1.5rem;
        }
        .swap-success-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .swap-success h2 {
          font-size: 1.5rem;
          color: #166534;
          margin-bottom: 0.5rem;
        }
        .swap-success-msg {
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        .swap-hash-key-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 1rem;
          padding: 1.2rem;
          margin-bottom: 1rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .swap-hash-key-box label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #92400e;
          margin-bottom: 0.5rem;
        }
        .swap-hash-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }
        .swap-hash-value code {
          font-size: 0.85rem;
          background: white;
          padding: 0.4rem 0.8rem;
          border-radius: 0.5rem;
          border: 1px solid #f59e0b;
          word-break: break-all;
          font-weight: 700;
          color: #78350f;
        }
        .swap-hash-value button {
          padding: 0.4rem 0.8rem;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .swap-paid-wallet {
          margin-bottom: 1rem;
          font-size: 0.85rem;
          color: #475569;
        }
        .swap-paid-wallet code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 0.3rem;
        }
        .swap-status-info {
          margin-bottom: 1rem;
        }
        .badge-pending {
          background: #fef3c7;
          color: #92400e;
          padding: 0.2rem 0.6rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .swap-back-btn {
          padding: 0.7rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .swap-claim-section {
          padding: 1.5rem;
        }
        .swap-claim-form {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          margin-bottom: 1.5rem;
        }
        .swap-claim-form h3 {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }
        .swap-claim-form p {
          color: #64748b;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .swap-claim-input {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-family: monospace;
          margin-bottom: 1rem;
          outline: none;
          box-sizing: border-box;
        }
        .swap-claim-input:focus {
          border-color: #2563eb;
        }
        .swap-claim-btn {
          width: 100%;
          padding: 0.8rem;
          background: #059669;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
        }
        .swap-claim-btn:disabled {
          background: #94a3b8;
        }
        .swap-claim-msg {
          margin-top: 1rem;
          padding: 0.8rem;
          border-radius: 0.75rem;
          font-weight: 600;
          text-align: center;
        }
        .swap-claim-msg.success {
          background: #d1fae5;
          color: #065f46;
        }
        .swap-claim-msg.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .swap-history {
          margin-top: 1rem;
        }
        .swap-history h3 {
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          color: #1e293b;
        }
        .swap-history-empty {
          color: #94a3b8;
          text-align: center;
          padding: 1.5rem;
        }
        .swap-history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .swap-history-table th {
          text-align: left;
          padding: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
        }
        .swap-history-table td {
          padding: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .small-hash {
          font-size: 0.75rem;
          background: #f1f5f9;
          padding: 0.15rem 0.3rem;
          border-radius: 0.25rem;
        }
        .badge-pending { background: #fef3c7; color: #92400e; padding: 0.15rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 700; }
        .badge-processed { background: #dbeafe; color: #1e40af; padding: 0.15rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 700; }
        .badge-completed { background: #d1fae5; color: #065f46; padding: 0.15rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default ExchangePage;
