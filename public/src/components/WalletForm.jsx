import { useEffect, useState } from "react";
import { API } from "../config/api";

export default function WalletForm() {
  const [wallets, setWallets] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    walletName: "",
    walletAddress: "",
    hashKey: ""
  });

  const loadWallets = () => {
    fetch(`${API}/api/wallets`)
      .then(res => res.json())
      .then(data => setWallets(data || []));
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await fetch(`${API}/api/wallets/update/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setEditingId(null);
    } else {
      await fetch(`${API}/api/wallets/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          uploadedBy: "admin"
        })
      });
    }

    setForm({ walletName: "", walletAddress: "", hashKey: "" });
    loadWallets();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await fetch(`${API}/api/wallets/delete/${id}`, {
      method: "DELETE"
    });
    loadWallets();
  };

  const handleEdit = (w) => {
    setEditingId(w.id);
    setForm({
      walletName: w.walletName,
      walletAddress: w.walletAddress,
      hashKey: w.hashKey
    });
  };

  const inputStyles = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-10 bg-gray-50 min-h-screen">
      
      {/* FORM SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {editingId ? "✏️ Edit Wallet" : "➕ Add New Wallet"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
            <input
              className={inputStyles}
              placeholder="e.g. USDT Wallet"
              value={form.walletName}
              onChange={(e) => setForm({ ...form, walletName: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
            <input
              className={inputStyles}
              placeholder="0x..."
              value={form.walletAddress}
              onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Hash Key</label>
            <input
              className={inputStyles}
              placeholder="Security Key"
              value={form.hashKey}
              onChange={(e) => setForm({ ...form, hashKey: e.target.value })}
            />
          </div>

          <button className={`w-full py-2.5 rounded-lg font-bold text-white transition-all active:scale-95 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {editingId ? "Update Wallet" : "Save Wallet"}
          </button>
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">Manage Wallets</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Wallet Name</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold">Hash Key</th>
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wallets.length > 0 ? (
                wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{w.walletName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-600 truncate max-w-[150px]">{w.walletAddress}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{w.hashKey}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">{w.uploadedBy}</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(w)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(w.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">No wallets found. Add one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}