import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../config/api";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/wallets`)
      .then(res => res.json())
      .then(data => setWallets(data || []))
      .catch(err => console.error("Error fetching wallets:", err));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 min-h-screen bg-gray-50">
      <div className="mb-10 border-b pb-6 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Official Wallets</h2>
        <p className="text-gray-500 mt-2">Platform wallets. Deposits are currently credited to the wallet by an administrator.</p>
      </div>

      <div className="mb-8">
        <button
          onClick={() => navigate("/profile/wallet")}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg"
        >
          Go to Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {wallets.length === 0 && (
          <div className="p-10 text-center bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
            No wallets assigned yet.
          </div>
        )}

        {wallets.map(w => (
          <div key={w.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{w.walletName}</span>
            </div>
            <p className="text-xs text-gray-400 font-bold mb-2 uppercase">Official Address</p>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between group-hover:border-blue-200 transition-colors">
              <code className="text-sm font-mono text-gray-600 break-all select-all leading-relaxed">
                {w.walletAddress}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(w.walletAddress); alert("Copied!"); }}
                className="ml-3 p-2 bg-white rounded-xl shadow-sm text-blue-600 hover:scale-110 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-blue-50 p-6 rounded-3xl border border-blue-100">
        <p className="text-sm text-blue-700 font-medium">
          Open{" "}
          <button onClick={() => navigate("/profile/wallet")} className="text-blue-600 underline font-bold">
            Wallet
          </button>{" "}
          to view your balance and make a withdrawal. Funds are credited to the wallet by an administrator.
        </p>
      </div>
    </div>
  );
}
