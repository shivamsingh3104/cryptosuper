import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowUpFromLine,
  Repeat,
  Menu,
  X,
  Camera,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";
import authedFetch from "../utils/authedFetch";
import { fmtDate } from "../utils/date";



export default function WalletDashboard() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Deposit flow hata diya gaya hai — paisa sirf admin wallet me daalta hai.
  const [coinSearch, setCoinSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [msg, setMsg] = useState(null);

  // ── Withdrawal state ──
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [selectedWithdrawCoin, setSelectedWithdrawCoin] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAddrType, setWithdrawAddrType] = useState("");
  const [rawBalances, setRawBalances] = useState({});
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const getCoinBalance = (symbol) => {
    if (!symbol) return 0;
    const s = symbol.toUpperCase();
    if (s === "USDT") return rawBalances.balance || 0;
    const specific = rawBalances[s + "Balance"];
    if (specific !== undefined && specific !== null) return specific;
    return 0;
  };

  // Pending withdrawal ka amount — balance nahi badla, par woh coins
  // "reserved" hain jab tak admin approve/reject nahi karta.
  const getPendingHold = (symbol) => {
    if (!symbol) return 0;
    const s = symbol.toUpperCase();
    const list = rawBalances.pendingHolds || [];
    return list.find(h => h.coin === s)?.amount || 0;
  };

  // Jo user sach me naya withdraw kar sakta hai.
  const getAvailableBalance = (symbol) => {
    const total = getCoinBalance(symbol);
    return Math.max(0, total - getPendingHold(symbol));
  };

  const videoRef = useRef(null);

  const [userBalance, setUserBalance] = useState(null);
  const [btcBalance, setBtcBalance] = useState(0);
  const [ethBalance, setEthBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const fetchBalance = useCallback((showLoading = true) => {
    if (!user?.uid) { setBalanceLoading(false); return; }
    if (showLoading) setBalanceLoading(true);
    authedFetch(`/api/users/balance`)
      .then(r => r.json())
      .then(d => {
        setRawBalances(d);
        setUserBalance(typeof d.balance === "number" ? d.balance : 0);
        setBtcBalance(typeof d.BTCBalance === "number" ? d.BTCBalance : 0);
        setEthBalance(typeof d.ETHBalance === "number" ? d.ETHBalance : 0);
      })
      .catch(() => {})
      .finally(() => { if (showLoading) setBalanceLoading(false); });
  }, [user?.uid]);

  useEffect(() => { fetchBalance(true); }, [fetchBalance]);

  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(() => fetchBalance(false), 2000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  // ── Pending requests ──
  // Deposit/withdrawal submit karne par balance abhi nahi hila. Ye list batati
  // hai ki kitne requests admin ke approval ka intezaar kar rahe hain.
  const [pendingRequests, setPendingRequests] = useState([]);

  const fetchPending = useCallback(() => {
    if (!user?.uid) { setPendingRequests([]); return; }
    authedFetch(`/api/transactions/user/${user.uid}`)
      .then(r => r.json())
      .then(data => {
        const list = (Array.isArray(data) ? data : []).filter(
          t => t.status === "pending" && (t.type === "deposit" || t.type === "withdrawal")
        );
        setPendingRequests(list);
      })
      .catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    fetchPending();
    if (!user?.uid) return;
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // ── Withdrawal functions ──
  const openWithdrawModal = (coin) => {
    if (coin) {
      setSelectedWithdrawCoin(coin);
      setWithdrawStep(2);
    } else {
      setWithdrawStep(1);
      setSelectedWithdrawCoin(null);
    }
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawAddrType("");
    setCoinSearch("");
    setShowWithdraw(true);
  };

  const closeWithdraw = () => {
    setShowWithdraw(false);
    setWithdrawStep(1);
    setSelectedWithdrawCoin(null);
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawAddrType("");
  };

  const handleWithdrawSubmit = async () => {
    if (!isLoggedIn || !selectedWithdrawCoin) return;
    if (!withdrawAddrType) return setMsg("Select an address type");
    if (!withdrawAddress) return setMsg("Enter withdrawal address");
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return setMsg("Enter a valid amount");

    // Available, na ki raw balance — pending request wale coins reserved hain.
    const bal = getAvailableBalance(selectedWithdrawCoin.symbol);
    const held = getPendingHold(selectedWithdrawCoin.symbol);
    if (Number(withdrawAmount) > bal) {
      return setMsg(held > 0
        ? `Only ${bal} ${selectedWithdrawCoin.symbol} available — ${held} is pending approval`
        : "Insufficient balance");
    }

    setWithdrawSubmitting(true);
    try {
      const res = await authedFetch(`/api/transactions/withdraw`, {
        method: "POST",
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email || "",
          amount: Number(withdrawAmount),
          coin: selectedWithdrawCoin.symbol.toUpperCase(),
          method: withdrawAddrType,
          walletAddress: withdrawAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Request submitted. Balance is deducted only after admin approval.");
        fetchBalance();
        setTimeout(() => { setMsg(null); closeWithdraw(); }, 3500);
      } else {
        setMsg(data.error || "Submission failed");
      }
    } catch (e) {
      setMsg("Network error. Try again.");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = stream; }
    } catch { setMsg("Camera access denied"); setTimeout(() => setMsg(null), 3000); }
  };
  const stopScanner = () => {
    if (videoRef.current?.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
  };
  useEffect(() => { if (scannerOpen) startScanner(); else stopScanner(); }, [scannerOpen]);

  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/wallets`)
      .then(r => r.json())
      .then(d => {
        console.log("WALLETS FROM API:", d);
        setWallets(Array.isArray(d) ? d : []);
      })
      .catch(e => console.error("WALLETS FETCH ERROR:", e));
  }, []);


  // ── Coin fetching ──
  //
  // Pehle ye browser se seedha CoinGecko (`per_page=250`) call karta tha. Free
  // tier ise rate-limit karta hai, aur call fail hone par `coins` khaali reh
  // jata tha — jiski wajah se `filteredCoins` bhi khaali ho jata tha aur user
  // ka BALANCE hi render nahi hota tha, jabki balance API se aa raha tha. Yaani
  // price feed fail hone se user ko apna paisa invisible dikhta tha.
  //
  // Ab price server ke cached proxy (/api/prices) se aati hai, aur list hamesha
  // backend ke supported-coins registry se banti hai. Price na mile to row
  // phir bhi render hoti hai, price sirf "—" dikhta hai.
  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/prices`);
      const json = await res.json();
      const prices = json?.prices || {};
      setCoins((prev) => {
        const existing = new Map(prev.map((c) => [c.id, c]));
        for (const [id, p] of Object.entries(prices)) {
          existing.set(id, { ...existing.get(id), ...p });
        }
        return [...existing.values()];
      });
    } catch (err) {
      console.log("price fetch failed, list will still render from registry:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCoins(); }, [fetchCoins]);

  // Registry se list banao. Price data aane tak bhi rows render hongi, sirf
  // price/naam/image "—" rahenge. Isse balance kabhi invisible nahi hota.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/supported-coins`)
      .then((r) => r.json())
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        setCoins((prev) => {
          const byId = new Map(prev.map((c) => [c.id, c]));
          // Registry order (BTC, ETH, USDT, ...) + uske baad extra listed coins.
          list.forEach(({ id, symbol }) => {
            const hit = prev.find((c) => (c.symbol || "").toUpperCase() === symbol);
            byId.set(id, { ...(hit || {}), id, symbol, name: hit?.name || symbol, image: hit?.image });
          });
          return [...byId.values()];
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const filtered = coins.filter(
      (coin) =>
        (coin.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (coin.symbol || "").toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCoins(filtered);
  }, [coins, search]);

  const handleScroll = () => {};

  // Withdraw modal me coin list — search box se filter hoti hai.
  const depositCoins = filteredCoins.filter(c =>
    !coinSearch || c.name.toLowerCase().includes(coinSearch.toLowerCase()) || c.symbol.toLowerCase().includes(coinSearch.toLowerCase())
  );

  // Compute total portfolio USD
  const portfolioTotalUsd = (rawBalances.balance || 0) + coins.reduce((sum, coin) => {
    if (coin.symbol.toUpperCase() === "USDT") return sum;
    const bal = getCoinBalance(coin.symbol);
    return sum + bal * (coin.current_price || 0);
  }, 0);

  // BTC me portfolio ka approx value. Pehle yahan `portfolioTotalUsd / 80000`
  // likha tha — matlab BTC ka price hardcode 80,000 tha. Usse real BTC price
  // move hone par bhi ye line galat rehti, aur BTC price load na ho to seedha
  // 0/80000 = 0.0000 dikhta. Ab live price use karte hain, warna number hi
  // nahi dikhate.
  const btcPrice = coins.find((c) => c.symbol.toUpperCase() === "BTC")?.current_price || 0;

  return (
    <div className="min-h-screen bg-[#f6f8fb] p-3 sm:p-4 lg:p-6">
      {msg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100000] bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-xl">
          {msg}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">

        {/* TOP CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Assets Overview</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-1">{balanceLoading ? "—" : portfolioTotalUsd.toFixed(2)} USD</h1>
              <p className="text-gray-400 text-sm mt-1">
                ≈ {balanceLoading || !portfolioTotalUsd || !btcPrice
                  ? "—"
                  : (portfolioTotalUsd / btcPrice).toFixed(6)}{" "}
                BTC
              </p>

            </div>
            <div className="flex flex-wrap gap-2">
              {/* Deposit button hata diya — admin hi wallet me credit karta hai. */}
              <button className="border border-gray-300 px-4 sm:px-5 py-2.5 rounded-xl hover:bg-gray-100 text-sm font-medium" onClick={() => navigate("/swap")}>
                Swap
              </button>
              <button className="border border-gray-300 px-4 sm:px-5 py-2.5 rounded-xl hover:bg-gray-100 text-sm font-medium">
                Transfer
              </button>
              <button className="border border-gray-300 px-4 sm:px-5 py-2.5 rounded-xl hover:bg-gray-100 text-sm font-medium flex items-center gap-2" onClick={() => openWithdrawModal()}>
                <ArrowUpFromLine size={16} />
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* PENDING REQUESTS */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 sm:p-5 mt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-amber-900">
                {pendingRequests.length} request{pendingRequests.length > 1 ? "s" : ""} awaiting approval
              </h2>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Balance only changes after an admin approves it. The withdrawal amount
              stays reserved until approval.
            </p>
            <div className="space-y-2">
              {pendingRequests.map(r => (
                <div
                  key={`${r.type}-${r.id}`}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl border border-amber-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800">
                      {r.type === "deposit" ? "Deposit" : "Withdrawal"} · {r.coin || "USDT"}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {r.type === "deposit"
                        ? `Awaiting credit · ${fmtDate(r.createdAt)}`
                        : `To ${r.walletAddress?.slice(0, 14)}… · ${fmtDate(r.createdAt)}`}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold whitespace-nowrap ${
                      r.type === "deposit" ? "text-emerald-600" : "text-amber-700"
                    }`}
                  >
                    {r.type === "deposit" ? "+" : "−"}
                    {Number(r.amount).toLocaleString()} {r.coin || "USDT"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div className="flex justify-between items-center mt-5 gap-3">
          <div className="hidden sm:flex items-center gap-2 text-gray-600">
            <Menu size={18} />
            <span className="text-sm font-medium">Assets</span>
          </div>
          <div className="relative w-full sm:max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 mt-5 overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide">
            <div>Assets</div>
            <div>Overall</div>
            <div>Main</div>
            <div>Trade</div>
            <div>Collateral</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto" onScroll={handleScroll}>
            {filteredCoins.map((coin) => (
              <div
                key={coin.id}
                className="border-t border-gray-100 px-4 sm:px-6 py-4 hover:bg-gray-50 transition"
              >
                {/* MOBILE */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={coin.image || ""} alt={coin.name} className="w-10 h-10 rounded-full" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                      <div>
                        <h3 className="font-semibold text-sm uppercase">{coin.symbol}</h3>
                        <p className="text-xs text-gray-500">{coin.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-sm">${coin.current_price?.toLocaleString()}</h4>
                      <p className={`text-xs font-medium ${coin.price_change_percentage_24h > 0 ? "text-green-500" : "text-red-500"}`}>
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div>
                      <p className="text-gray-400">Your balance</p>
                      <p className="font-semibold mt-1">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</p>
                    </div>
                    <div><p className="text-gray-400">Market Cap</p><p className="font-medium mt-1">${coin.market_cap?.toLocaleString()}</p></div>
                    <div><p className="text-gray-400">Volume</p><p className="font-medium mt-1">${coin.total_volume?.toLocaleString()}</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {/* Deposit button hata diya — admin hi credit karta hai. */}
                    <button className="flex-1 border border-gray-300 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-100" onClick={() => navigate("/swap")}>
                      <Repeat size={14} /> Swap
                    </button>
                    <button className="flex-1 border border-gray-300 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-100" onClick={() => openWithdrawModal(coin)}>
                      <ArrowUpFromLine size={14} /> Withdraw
                    </button>
                  </div>
                </div>

                {/* DESKTOP */}
                <div className="hidden md:grid grid-cols-6 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <img src={coin.image || ""} alt={coin.name} className="w-10 h-10 rounded-full" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                    <div>
                      <h3 className="font-semibold text-sm uppercase">{coin.symbol}</h3>
                      <p className="text-xs text-gray-500">{coin.name}</p>
                    </div>
                  </div>
                  {/* myamoto.com reference layout: Overall / Main / Trade / Collateral.
                      Chaaron abhi ek hi stored balance dikhate hain, kyunki
                      backend me per coin sirf EK field hai (balance /
                      BTCBalance). Ye sirf display hai — paisa kahin nahi gaya,
                      Transfer bhi overall balance ko nahi chhedta. Asli alag
                      sub-wallet storage chahiye to ye chaaron columns alag
                      fields se aane chahiye. */}
                  <div className="text-sm font-semibold">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</div>
                  <div className="text-sm font-semibold">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</div>
                  <div className="text-sm text-gray-700">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</div>
                  <div className="text-sm text-gray-700">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</div>
                  <div className="flex justify-end gap-2">
                    {/* Deposit button hata diya — admin hi credit karta hai. */}
                    <button className="border border-gray-300 px-3 py-2 rounded-lg text-xs hover:bg-gray-100 flex items-center gap-1" onClick={() => navigate("/swap")}>
                      <Repeat size={14} /> Swap
                    </button>
                    <button className="border border-gray-300 px-3 py-2 rounded-lg text-xs hover:bg-gray-100 flex items-center gap-1" onClick={() => openWithdrawModal(coin)}>
                      <ArrowUpFromLine size={14} /> Withdraw
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {loading && <div className="p-5 text-center text-sm text-gray-500">Loading more coins...</div>}
          </div>
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdraw && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={closeWithdraw}>
          <div style={{background:'white',borderRadius:16,padding:24,maxWidth:1000,width:'100%',maxHeight:'90vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h2 style={{fontSize:20,fontWeight:'bold',margin:0}}>Withdraw</h2>
              <button onClick={closeWithdraw} style={{background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:18}}>✕</button>
            </div>

            {/* Two-column layout */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
              {/* LEFT: Coin Selection */}
              <div style={{borderRight:'1px solid #e5e7eb',paddingRight:24}}>
                <p style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:12}}>Select Coin</p>
                <input style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,marginBottom:12,fontSize:14,boxSizing:'border-box'}} placeholder="Search coin..." value={coinSearch} onChange={e => setCoinSearch(e.target.value)} />
                <div style={{maxHeight:400,overflowY:'auto'}}>
                  {depositCoins.map(c => (
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:12,border:'1px solid #eee',borderRadius:8,cursor:'pointer',marginBottom:6,background: selectedWithdrawCoin?.id === c.id ? '#eff6ff' : 'white',borderColor: selectedWithdrawCoin?.id === c.id ? '#3b82f6' : '#eee'}}
                      onClick={() => { setSelectedWithdrawCoin(c); setCoinSearch(""); setWithdrawAmount(""); setWithdrawAddress(""); setWithdrawAddrType(""); }}>
                      <img src={c.image} alt="" style={{width:32,height:32,borderRadius:'50%'}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13}}>{c.symbol?.toUpperCase()}</div>
                        <div style={{fontSize:11,color:'#999',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</div>
                      </div>
                      <div style={{fontSize:11,fontWeight:600,color:'#666'}}>${c.current_price?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Withdrawal Details */}
              <div>
                {selectedWithdrawCoin ? (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <img src={selectedWithdrawCoin.image} alt="" style={{width:32,height:32,borderRadius:'50%'}} />
                      <span style={{fontWeight:600,fontSize:15}}>{selectedWithdrawCoin.symbol?.toUpperCase()}</span>
                      <span style={{marginLeft:'auto',fontSize:13,color:'#666'}}>${selectedWithdrawCoin.current_price?.toLocaleString()}</span>
                    </div>
                    <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:16,marginBottom:16}}>
                      <p style={{fontSize:11,fontWeight:600,color:'#2563eb',margin:0}}>Available Balance</p>
                      <p style={{fontSize:20,fontWeight:'bold',color:'#1d4ed8',marginTop:4,cursor:'pointer',margin:0}} onClick={() => setWithdrawAmount(getAvailableBalance(selectedWithdrawCoin.symbol).toString())}>{getAvailableBalance(selectedWithdrawCoin.symbol).toFixed(4)} {selectedWithdrawCoin.symbol?.toUpperCase()}</p>
                      {getPendingHold(selectedWithdrawCoin.symbol) > 0 && (
                        <p style={{fontSize:11,color:'#b45309',margin:'6px 0 0',fontWeight:600}}>
                          {getPendingHold(selectedWithdrawCoin.symbol).toFixed(4)} {selectedWithdrawCoin.symbol?.toUpperCase()} pending approval (not deducted yet)
                        </p>
                      )}
                    </div>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:12,fontWeight:600,marginBottom:4,display:'block',color:'#374151'}}>Amount</label>
                      <input type="number" style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,fontSize:14,boxSizing:'border-box'}} placeholder="0.00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                    </div>
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:12,fontWeight:600,marginBottom:4,display:'block',color:'#374151'}}>Withdrawal Address</label>
                      <input type="text" style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,fontSize:12,fontFamily:'monospace',boxSizing:'border-box'}} placeholder="Enter your wallet address" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} />
                    </div>
                    {/* Address Type / Network Selection */}
                    <div style={{marginBottom:12}}>
                      <label style={{fontSize:12,fontWeight:600,marginBottom:4,display:'block',color:'#374151'}}>Select Network</label>
                      {(() => {
                        const filtered = wallets.filter(w => {
                          const name = (w.walletName || w.name || "").toUpperCase();
                          const sym = (selectedWithdrawCoin.symbol || selectedWithdrawCoin.name || "").toUpperCase();
                          return name.includes(sym);
                        });
                        if (filtered.length === 0) {
                          return <p style={{fontSize:13,color:'red'}}>No network available for this coin. Contact admin.</p>;
                        }
                        return (
                          <div style={{maxHeight:120,overflowY:'auto'}}>
                            {filtered.map(w => {
                              const netName = (w.walletName || w.name || "").toUpperCase();
                              return (
                                <div key={w.id}
                                  style={{
                                    display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                                    border: '1px solid ' + (withdrawAddrType === netName ? '#3b82f6' : '#ddd'),
                                    borderRadius: 8, cursor:'pointer', marginBottom:6,
                                    background: withdrawAddrType === netName ? '#eff6ff' : 'white'
                                  }}
                                  onClick={() => setWithdrawAddrType(netName)}
                                >
                                  <div style={{width:28,height:28,borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:'bold',color:'#666'}}>
                                    {netName.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:600}}>{w.walletName || w.name}</div>
                                    <div style={{fontSize:11,color:'#999'}}>Withdraw via {netName}</div>
                                  </div>
                                  {withdrawAddrType === netName && <span style={{marginLeft:'auto',color:'#2563eb',fontWeight:'bold'}}>✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                    <button style={{width:'100%',padding:'12px',background:'#ea580c',color:'white',border:'none',borderRadius:8,fontSize:14,fontWeight:'bold',cursor:'pointer'}} onClick={handleWithdrawSubmit} disabled={withdrawSubmitting}>
                      {withdrawSubmitting ? "Processing..." : "Withdraw"}
                    </button>
                  </>
                ) : (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,color:'#999',fontSize:14}}>
                    Select a coin from the left to withdraw
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100000] flex items-center justify-center p-4" onClick={() => setScannerOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <button className="float-right text-gray-400 hover:text-gray-600" onClick={() => setScannerOpen(false)}><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-900 mt-2">Scan QR Code</h3>
            <p className="text-sm text-gray-500 mb-4">Point your camera at the payment QR code</p>
            <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden bg-gray-900 mb-4">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
              <div className="absolute inset-6 border-2 border-blue-400/60 rounded-lg pointer-events-none">
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br" />
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              onClick={() => { stopScanner(); setScannerOpen(false); setMsg("QR code captured"); setTimeout(() => setMsg(null), 2000); }}
            >
              <Camera size={16} /> Capture Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
