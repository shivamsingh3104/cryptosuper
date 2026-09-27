import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Menu,
  X,
  Camera,
  ChevronRight,
} from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";



export default function WalletDashboard() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action");

  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showDeposit, setShowDeposit] = useState(action === "deposit");
  const [depositStep, setDepositStep] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [coinSearch, setCoinSearch] = useState("");
  const [addressType, setAddressType] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
  const videoRef = useRef(null);

  const [userBalance, setUserBalance] = useState(null);
  const [btcBalance, setBtcBalance] = useState(0);
  const [ethBalance, setEthBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const fetchBalance = useCallback((showLoading = true) => {
    if (!user?.uid) { setBalanceLoading(false); return; }
    if (showLoading) setBalanceLoading(true);
    fetch(`${API}/api/users/balance?uid=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        setRawBalances(d);
        setUserBalance(typeof d.balance === "number" ? d.balance : 0);
        setBtcBalance(typeof d.BTCBalance === "number" ? d.BTCBalance : 0);
        setEthBalance(typeof d.ETHBalance === "number" ? d.ETHBalance : 0);
        console.log("BALANCE RAW:", d);
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

  useEffect(() => {
    if (action === "deposit") { setShowDeposit(true); setDepositStep(1); }
  }, [action]);

  const openDepositModal = (coin) => {
    setSelectedCoin(coin);
    setDepositStep(coin ? 2 : 1);
    setCoinSearch("");
    setTxHash("");
    setShowDeposit(true);
    navigate("/profile/wallet?action=deposit", { replace: true });
  };

  const closeDeposit = () => {
    setShowDeposit(false); setDepositStep(1); setSelectedCoin(null);
    navigate("/profile/wallet", { replace: true });
  };

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
    setShowDeposit(false);
    console.log("openWithdrawModal called, showWithdraw set to true");
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
    const bal = getCoinBalance(selectedWithdrawCoin.symbol);
    if (Number(withdrawAmount) > bal) return setMsg("Insufficient balance");
    setWithdrawSubmitting(true);
    try {
      const res = await fetch(`${API}/api/transactions/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setMsg("Withdrawal request submitted! Awaiting admin approval.");
        fetchBalance();
        setTimeout(() => { setMsg(null); closeWithdraw(); }, 3000);
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

  useEffect(() => {
    if (!addressType) { setDepositAddress(""); return; }
    const found = wallets.find(w => {
      const name = (w.walletName || w.name || "").toUpperCase();
      return name.includes(addressType);
    });
    if (found) setDepositAddress(found.walletAddress || found.address || "");
    else setDepositAddress("");
  }, [addressType, wallets]);

  const filteredWallets = selectedCoin
    ? wallets.filter(w => {
        const name = (w.walletName || w.name || "").toUpperCase();
        const sym = selectedCoin.symbol.toUpperCase();
        return name.includes(sym);
      })
    : [];

  useEffect(() => {
    if (showQr && depositAddress) {
      QRCode.toDataURL(depositAddress, { width: 200, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [showQr, depositAddress]);

  const handleDepositSubmit = async () => {
    if (!isLoggedIn || !selectedCoin) return;
    if (!addressType) return setMsg("Select an address type first");
    if (!depositAddress) return setMsg("No deposit address available");
    if (!depositAmount || Number(depositAmount) <= 0) return setMsg("Enter a valid deposit amount");
    setShowQr(true);
  };

  const handleSubmitDepositRequest = async () => {
    if (!isLoggedIn || !selectedCoin || !depositAddress || !depositAmount) return;
    setSubmitting(true);
    const usdAmount = Number(depositAmount);
    const coinPrice = selectedCoin.current_price || 1;
    const coinAmount = selectedCoin.symbol.toUpperCase() === "USDT" ? usdAmount : usdAmount / coinPrice;
    const bodyData = {
      userId: user.uid,
      userEmail: user.email || "",
      amount: coinAmount,
      usdAmount: usdAmount,
      currency: "USD",
      coin: selectedCoin.symbol.toUpperCase(),
      method: addressType,
      type: "crypto",
      walletAddress: depositAddress,
      txHash: txHash || ""
    };
    console.log("DEPOSIT REQUEST:", bodyData);
    try {
      const res = await fetch(`${API}/api/transactions/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Deposit request submitted! Balance will be credited after admin approval.");
        setTimeout(() => { setMsg(null); closeDeposit(); }, 4000);
      } else {
        setMsg(data.error || "Submission failed");
      }
    } catch (e) {
      setMsg("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setMsg("Address copied!");
    setTimeout(() => setMsg(null), 2000);
  };

  // ── Coin fetching ──
  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setCoins((prev) => {
          const existing = new Map(prev.map(c => [c.id, c]));
          data.forEach(c => { if (!existing.has(c.id)) existing.set(c.id, c); });
          return [...existing.values()];
        });
      }
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchCoins(); }, [fetchCoins]);

  useEffect(() => {
    const filtered = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCoins(filtered);
  }, [coins, search]);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 200;
    if (bottom && !loading) setPage((prev) => prev + 1);
  };

  const depositCoins = filteredCoins.filter(c =>
    !coinSearch || c.name.toLowerCase().includes(coinSearch.toLowerCase()) || c.symbol.toLowerCase().includes(coinSearch.toLowerCase())
  );

  // Compute total portfolio USD
  const portfolioTotalUsd = (rawBalances.balance || 0) + coins.reduce((sum, coin) => {
    if (coin.symbol.toUpperCase() === "USDT") return sum;
    const bal = getCoinBalance(coin.symbol);
    return sum + bal * (coin.current_price || 0);
  }, 0);

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
              <p className="text-gray-400 text-sm mt-1">≈ {balanceLoading || !portfolioTotalUsd ? "—" : (portfolioTotalUsd / 80000).toFixed(4)} BTC</p>

            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium"
                onClick={() => openDepositModal(null)}
              >
                <ArrowDownToLine size={16} />
                Deposit
              </button>
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
                      <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
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
                    <div><p className="text-gray-400">Market Cap</p><p className="font-medium mt-1">${coin.market_cap?.toLocaleString()}</p></div>
                    <div><p className="text-gray-400">Volume</p><p className="font-medium mt-1">${coin.total_volume?.toLocaleString()}</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      className="flex-1 border border-gray-300 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-100"
                      onClick={() => openDepositModal(coin)}
                    >
                      <ArrowDownToLine size={14} /> Deposit
                    </button>
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
                    <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-sm uppercase">{coin.symbol}</h3>
                      <p className="text-xs text-gray-500">{coin.name}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</div>
                  <div className="text-sm font-semibold">{getCoinBalance(coin.symbol).toFixed(4)} {coin.symbol.toUpperCase()}</div>
                  <div className="text-sm text-gray-700">0.00 {coin.symbol.toUpperCase()}</div>
                  <div className="text-sm text-gray-700">0.00 {coin.symbol.toUpperCase()}</div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="border border-gray-300 px-3 py-2 rounded-lg text-xs hover:bg-gray-100 flex items-center gap-1"
                      onClick={() => openDepositModal(coin)}
                    >
                      <ArrowDownToLine size={14} /> Deposit
                    </button>
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

      {/* ════════════════════════════════════════
          DEPOSIT MODAL (Tailwind)
          ════════════════════════════════════════ */}
      {showDeposit && (
        <div
          className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4"
          onClick={closeDeposit}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Deposit Crypto</h2>
                <button onClick={closeDeposit} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Coin Selection */}
                <div className="border-r border-gray-200 pr-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Select Coin</p>
                  <div className="relative mb-4">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search coin..."
                      value={coinSearch}
                      onChange={e => setCoinSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {depositCoins.map(c => (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                          selectedCoin?.id === c.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                        onClick={() => { setSelectedCoin(c); setCoinSearch(""); setShowQr(false); setDepositAmount(""); setAddressType(""); }}
                      >
                        <img src={c.image} alt={c.name} className="w-8 h-8 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 uppercase">{c.symbol}</div>
                          <div className="text-xs text-gray-500 truncate">{c.name}</div>
                        </div>
                        <div className="text-xs font-semibold text-gray-700">${c.current_price?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Deposit Details */}
                <div>
                  {selectedCoin ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                        <img src={selectedCoin.image} alt={selectedCoin.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-bold text-sm text-gray-900 uppercase">{selectedCoin.symbol}</div>
                          <div className="text-xs text-gray-500">{selectedCoin.name}</div>
                        </div>
                        <div className="ml-auto text-sm font-semibold text-gray-700">${selectedCoin.current_price?.toLocaleString()}</div>
                      </div>

                      {/* Coin-specific Balance */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <p className="text-xs text-blue-600 font-semibold uppercase">Your {selectedCoin.symbol.toUpperCase()} Balance</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">{getCoinBalance(selectedCoin.symbol).toFixed(6)} {selectedCoin.symbol.toUpperCase()}</p>
                      </div>

                      {/* Amount (USD) */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (USD)</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                        />
                        {depositAmount > 0 && selectedCoin?.current_price > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            ≈ {(Number(depositAmount) / selectedCoin.current_price).toFixed(8)} {selectedCoin.symbol.toUpperCase()}
                          </p>
                        )}
                      </div>

                      {/* Address Type */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Address Type</label>
                        {filteredWallets.length === 0 ? (
                          <p className="text-sm text-red-500">No wallet address available for this coin. Contact admin.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {filteredWallets.map(w => {
                              const netName = (w.walletName || w.name || "").toUpperCase();
                              return (
                                <div
                                  key={w.id}
                                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                                    addressType === netName ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                                  }`}
                                  onClick={() => { setAddressType(netName); setShowQr(false); }}
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {netName}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-sm text-gray-900">{w.walletName || w.name}</div>
                                    <div className="text-xs text-gray-500">Deposit via {netName}</div>
                                  </div>
                                  {addressType === netName && <span className="ml-auto text-blue-600 font-bold text-lg">✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Deposit Address + QR + Actions */}
                      {showQr && depositAddress ? (
                        <div className="mb-4 space-y-3">
                          {qrDataUrl && (
                            <div className="flex justify-center">
                              <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deposit Address ({addressType})</label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                              <code className="flex-1 text-xs font-mono break-all select-all">{depositAddress}</code>
                              <button onClick={copyAddress} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Copy">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold mt-4"
                        onClick={handleSubmitDepositRequest}
                        disabled={submitting}
                      >
                        {submitting ? "Submitting..." : "Submit Deposit"}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[300px] text-gray-400 text-sm">
                      Select a coin from the left to start depositing
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <p style={{fontSize:20,fontWeight:'bold',color:'#1d4ed8',marginTop:4,cursor:'pointer',margin:0}} onClick={() => setWithdrawAmount(getCoinBalance(selectedWithdrawCoin.symbol).toString())}>{getCoinBalance(selectedWithdrawCoin.symbol).toFixed(4)} {selectedWithdrawCoin.symbol?.toUpperCase()}</p>
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
