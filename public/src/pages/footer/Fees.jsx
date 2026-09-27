import React, { useEffect, useState } from "react";

const BASE = "https://api.coingecko.com/api/v3";

export default function FeesPage() {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    fetch(`${BASE}/coins/markets?vs_currency=usd&per_page=15&page=1`)
      .then((res) => res.json())
      .then((data) => setCoins(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-6 py-12 md:px-16">
      <div className="max-w-7xl mx-auto">

        {/* ===== Fees ===== */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Fees
        </h1>

        <p className="text-gray-500 text-base md:text-lg max-w-3xl mb-10 leading-relaxed">
          Withdrawal fees depend on the value of the blockchain and asset prices.
          They are subject to change without notice. Always check the information.
        </p>

        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
          Trading Fees
        </h2>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col justify-between h-[180px] border border-gray-200">
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Standard trading fee. Please note that for some pairs the trading fee may differ but does not exceed 0.1%
            </p>
            <p className="text-xl font-semibold text-gray-900 mt-6">0.1%</p>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col justify-between h-[180px] border border-gray-200">
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Daily fee for using funds in margin trading and loans
            </p>
            <p className="text-xl font-semibold text-gray-900 mt-6">0.078%</p>
          </div>
        </div>

        {/* ===== Payment Fees ===== */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Payment Fees
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Checkout our Payment Fees
        </p>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 px-4 py-3 text-xs text-gray-500 bg-gray-50">
            <div className="col-span-2">Payment method</div>
            <div className="hidden md:block">Min deposit</div>
            <div className="hidden md:block">Deposit fee</div>
            <div></div>
          </div>

          {/* Rows */}
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="grid grid-cols-3 md:grid-cols-5 gap-4 items-center px-4 py-3 border-t border-gray-100 hover:bg-gray-50 transition"
            >
              {/* Coin Info */}
              <div className="col-span-2 flex items-center gap-3">
                <img
                  src={coin.image}
                  alt={coin.symbol}
                  className="w-8 h-8"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {coin.symbol.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">{coin.name}</p>
                </div>
              </div>

              {/* Fake min deposit (UI purpose) */}
              <div className="hidden md:block text-sm text-gray-700">
                {(1 / coin.current_price).toFixed(5)} {coin.symbol.toUpperCase()}
              </div>

              {/* Fee */}
              <div className="hidden md:block text-sm text-gray-700">
                ~ 0 {coin.symbol.toUpperCase()}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1.5 text-xs border rounded-lg bg-gray-50 hover:bg-gray-100">
                  Deposit
                </button>
                <button className="px-3 py-1.5 text-xs border rounded-lg bg-gray-50 hover:bg-gray-100 hidden sm:inline">
                  Swap
                </button>
                <button className="px-3 py-1.5 text-xs border rounded-lg bg-gray-50 hover:bg-gray-100">
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}