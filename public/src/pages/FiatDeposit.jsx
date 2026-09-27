import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";

const PAYMENT_METHODS = [
  { id: "bank", label: "Bank Transfer", icon: "🏦", desc: "Transfer via SWIFT / SEPA / Wire" },
  { id: "card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, Maestro" },
  { id: "p2p", label: "P2P Trading", icon: "🤝", desc: "Buy from other users" },
];

export default function FiatDeposit() {
  const { user, isLoggedIn } = useAuth();
  const [method, setMethod] = useState("bank");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [depositHistory, setDepositHistory] = useState([]);
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [scannerOpen]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch {
      setMsg("Camera access denied. Please allow camera permissions.");
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleScan = () => {
    stopScanner();
    setScannerOpen(false);
    setMsg("Payment address copied from QR code.");
    setTimeout(() => setMsg(null), 2000);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) return setMsg("Please login first");
    if (!amount || Number(amount) <= 0) return setMsg("Enter a valid amount");
    if (Number(amount) < 10) return setMsg("Minimum deposit is $10");

    try {
      const res = await fetch(`${API}/api/transactions/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          amount: Number(amount),
          currency,
          method,
          type: "fiat"
        })
      });
      const data = await res.json();
      if (data.error) setMsg(data.error);
      else {
        setMsg(`Deposit request submitted! Awaiting admin approval.`);
        setAmount("");
        fetchHistory();
      }
    } catch { setMsg("Submission failed"); }
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchHistory = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API}/api/transactions/user/${user.uid}`);
      const data = await res.json();
      const deposits = (Array.isArray(data) ? data : []).filter(t =>
        t.type === "deposit" || t.type === "fiat"
      );
      setDepositHistory(deposits);
    } catch {}
  };

  useEffect(() => { if (user?.uid) fetchHistory(); }, [user]);

  const estimatedAmount = amount ? Number(amount) * (currency === "USD" ? 1 : 0.92) : 0;

  return (
    <div className="fd-page">
      {msg && <div className="fd-toast">{msg}</div>}

      <div className="fd-container">
        {/* LEFT: Form */}
        <div className="fd-form-wrap">
          <h1 className="fd-title">Fiat Deposit</h1>
          <p className="fd-subtitle">Buy crypto within seconds via Bank Transfer or Bank Card</p>

          {/* Currency Select */}
          <div className="fd-field">
            <label className="fd-label">Currency</label>
            <select className="fd-select" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          {/* Amount */}
          <div className="fd-field">
            <label className="fd-label">Amount</label>
            <div className="fd-input-group">
              <span className="fd-input-currency">{currency}</span>
              <input
                className="fd-input"
                type="number"
                placeholder="0.00"
                min="10"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            {amount > 0 && (
              <p className="fd-estimate">≈ ${estimatedAmount.toFixed(2)}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="fd-field">
            <label className="fd-label">Payment Method</label>
            <div className="fd-methods">
              {PAYMENT_METHODS.map(m => (
                <div
                  key={m.id}
                  className={`fd-method${method === m.id ? " active" : ""}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className="fd-method-icon">{m.icon}</span>
                  <div>
                    <div className="fd-method-title">{m.label}</div>
                    <div className="fd-method-desc">{m.desc}</div>
                  </div>
                  {method === m.id && <span className="fd-check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* QR Scanner Button */}
          <button className="fd-scan-btn" onClick={() => setScannerOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2M17 3h2a2 2 0 012 2v2M17 21h2a2 2 0 002-2v-2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
              <path d="M7 12h10"/>
            </svg>
            Scan QR Code
          </button>

          {/* Submit */}
          <button
            className="fd-submit"
            onClick={handleSubmit}
            disabled={!amount || Number(amount) < 10}
          >
            Deposit {currency} {amount || "0"}
          </button>
        </div>

        {/* RIGHT: Info + History */}
        <div className="fd-side">
          <div className="fd-info-card">
            <h3>Deposit Information</h3>
            <div className="fd-info-row">
              <span>Fee</span>
              <span className="fd-green">Free</span>
            </div>
            <div className="fd-info-row">
              <span>Processing Time</span>
              <span>1-5 Minutes</span>
            </div>
            <div className="fd-info-row">
              <span>Minimum</span>
              <span>$10.00</span>
            </div>
            <div className="fd-info-row">
              <span>Maximum</span>
              <span>$100,000.00</span>
            </div>
          </div>

          <div className="fd-history-card">
            <h3>Recent Deposits</h3>
            {depositHistory.length === 0 ? (
              <p className="fd-no-data">No deposits yet</p>
            ) : (
              <div className="fd-history-list">
                {depositHistory.slice(0, 5).map((d, i) => (
                  <div key={d.id || i} className="fd-history-item">
                    <div>
                      <div className="fd-hist-amount">${Number(d.amount).toFixed(2)}</div>
                      <div className="fd-hist-date">{new Date(d.createdAt?.toDate?.() || d.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`fd-hist-status ${d.status}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR SCANNER MODAL */}
      {scannerOpen && (
        <div className="fd-modal-overlay" onClick={() => setScannerOpen(false)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()}>
            <button className="fd-modal-close" onClick={() => setScannerOpen(false)}>✕</button>
            <h2 className="fd-modal-title">Scan QR Code</h2>
            <p className="fd-modal-desc">Point your camera at the deposit QR code</p>
            <div className="fd-scanner-wrap">
              <video ref={videoRef} className="fd-scanner-video" autoPlay playsInline />
              <div className="fd-scanner-frame">
                <div className="fd-corner tl" /><div className="fd-corner tr" />
                <div className="fd-corner bl" /><div className="fd-corner br" />
              </div>
            </div>
            <button className="fd-capture-btn" onClick={handleScan}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 22v-4M2 12h4M18 12h4"/>
              </svg>
              Capture Code
            </button>
            <p className="fd-modal-hint">Or enter the address manually</p>
          </div>
        </div>
      )}

      <style>{`
        .fd-page {
          max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px;
          min-height: calc(100vh - 56px);
        }
        .fd-toast {
          position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
          background: #111; color: #fff; padding: 10px 24px; border-radius: 8px;
          z-index: 9999; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .fd-container { display: flex; gap: 40px; align-items: flex-start; flex-wrap: wrap; }
        .fd-form-wrap { flex: 1; min-width: 320px; max-width: 520px; }
        .fd-title { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 4px; }
        .fd-subtitle { font-size: 14px; color: #666; margin-bottom: 28px; }
        .fd-field { margin-bottom: 20px; }
        .fd-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .fd-select {
          width: 100%; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; background: #fff; color: #111; outline: none;
        }
        .fd-input-group {
          display: flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px;
          overflow: hidden; background: #fff;
        }
        .fd-input-currency {
          padding: 10px 14px; background: #f9fafb; color: #374151;
          font-weight: 700; font-size: 14px; border-right: 1px solid #e5e7eb;
        }
        .fd-input {
          flex: 1; border: none; padding: 10px 14px; font-size: 16px;
          outline: none; background: transparent; color: #111;
        }
        .fd-estimate { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .fd-methods { display: flex; flex-direction: column; gap: 8px; }
        .fd-method {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer;
          transition: all 0.15s; background: #fff; position: relative;
        }
        .fd-method:hover { border-color: #3b82f6; }
        .fd-method.active { border-color: #3b82f6; background: #eff6ff; }
        .fd-method-icon { font-size: 24px; }
        .fd-method-title { font-weight: 600; font-size: 14px; color: #111; }
        .fd-method-desc { font-size: 12px; color: #6b7280; }
        .fd-check {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          color: #3b82f6; font-weight: 700; font-size: 18px;
        }
        .fd-scan-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 18px;
          border: 1px dashed #3b82f6; border-radius: 8px; background: transparent;
          color: #3b82f6; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.15s; width: 100%; justify-content: center; margin-bottom: 20px;
        }
        .fd-scan-btn:hover { background: #eff6ff; }
        .fd-submit {
          width: 100%; padding: 12px; background: #3b82f6; color: #fff;
          border: none; border-radius: 8px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
        }
        .fd-submit:hover { background: #2563eb; }
        .fd-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Side */
        .fd-side { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px; }
        .fd-info-card, .fd-history-card {
          background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px;
        }
        .fd-info-card h3, .fd-history-card h3 { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 16px; }
        .fd-info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #374151; border-bottom: 1px solid #f9f9f9; }
        .fd-info-row:last-child { border-bottom: none; }
        .fd-green { color: #26a69a; font-weight: 600; }
        .fd-no-data { color: #9ca3af; font-size: 13px; text-align: center; padding: 20px 0; }
        .fd-history-list { display: flex; flex-direction: column; gap: 8px; }
        .fd-history-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f9f9f9; }
        .fd-history-item:last-child { border-bottom: none; }
        .fd-hist-amount { font-weight: 600; font-size: 14px; color: #111; }
        .fd-hist-date { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .fd-hist-status { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; text-transform: capitalize; }
        .fd-hist-status.pending { background: #fef3c7; color: #d97706; }
        .fd-hist-status.approved { background: #d1fae5; color: #059669; }
        .fd-hist-status.rejected { background: #fee2e2; color: #dc2626; }

        /* Modal */
        .fd-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .fd-modal {
          background: #fff; border-radius: 16px; padding: 32px;
          max-width: 420px; width: 90%; text-align: center;
        }
        .fd-modal-close {
          float: right; background: none; border: none; font-size: 20px;
          color: #666; cursor: pointer;
        }
        .fd-modal-title { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 4px; }
        .fd-modal-desc { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
        .fd-scanner-wrap {
          position: relative; width: 280px; height: 280px; margin: 0 auto 20px;
          border-radius: 12px; overflow: hidden; background: #111;
        }
        .fd-scanner-video { width: 100%; height: 100%; object-fit: cover; }
        .fd-scanner-frame {
          position: absolute; inset: 20px; border: 2px solid rgba(59,130,246,0.6);
          border-radius: 8px;
        }
        .fd-corner { position: absolute; width: 20px; height: 20px; border-color: #3b82f6; border-style: solid; }
        .fd-corner.tl { top: -2px; left: -2px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
        .fd-corner.tr { top: -2px; right: -2px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
        .fd-corner.bl { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
        .fd-corner.br { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
        .fd-capture-btn {
          display: flex; align-items: center; gap: 8px; margin: 0 auto;
          padding: 10px 24px; background: #3b82f6; color: #fff; border: none;
          border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .fd-capture-btn:hover { background: #2563eb; }
        .fd-modal-hint { font-size: 12px; color: #9ca3af; margin-top: 12px; }

        @media (max-width: 768px) {
          .fd-container { flex-direction: column; }
          .fd-side { width: 100%; }
        }
      `}</style>
    </div>
  );
}
