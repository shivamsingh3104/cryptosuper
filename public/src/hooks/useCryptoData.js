import { useState, useEffect, useCallback } from "react";

const BASE = "https://api.coingecko.com/api/v3";

// Map coingecko id → trading pair label
const PAIR_MAP = {
  bitcoin: "BTC/USDT", ethereum: "ETH/USDT", binancecoin: "BNB/USDT",
  solana: "SOL/USDT", ripple: "XRP/USDT", dogecoin: "DOGE/USDT",
  cardano: "ADA/USDT", tron: "TRX/USDT", avalanche: "AVAX/USDT",
  chainlink: "LINK/USDT", polkadot: "DOT/USDT", "uniswap": "UNI/USDT",
  litecoin: "LTC/USDT", "near": "NEAR/USDT", aptos: "APT/USDT",
  sui: "SUI/USDT", "fetch-ai": "FET/USDT", "pepe": "PEPE/USDT",
  "shiba-inu": "SHIB/USDT", toncoin: "TON/USDT", "internet-computer": "ICP/USDT",
  "bitcoin-cash": "BCH/USDT", "wrapped-bitcoin": "WBTC/USDT",
  "usd-coin": "USDC/USDT", matic: "MATIC/USDT",
  tether: "USDT/USD",
};

const ICON_MAP = {
  bitcoin:"₿", ethereum:"Ξ", binancecoin:"🟠", solana:"◎", ripple:"Ⓧ",
  dogecoin:"🐕", cardano:"🅰️", tron:"🔺", avalanche:"🌊", chainlink:"🔗",
  polkadot:"📍", uniswap:"🦄", litecoin:"🪙", near:"🌿", aptos:"🚀",
  sui:"🌙", "fetch-ai":"🤖", pepe:"🐸", "shiba-inu":"🔷", toncoin:"💎",
  "internet-computer":"⭕", "bitcoin-cash":"⛓️", "wrapped-bitcoin":"🟡",
  "usd-coin":"💲", matic:"🟣",
  tether:"💲",
};

const BG_MAP = {
  bitcoin:"#fff7ed", ethereum:"#eff6ff", binancecoin:"#fff7ed", solana:"#f0fdf4",
  ripple:"#fdf4ff", dogecoin:"#fefce8", cardano:"#fdf4ff", tron:"#fff7ed",
  avalanche:"#fef2f2", chainlink:"#eff6ff", polkadot:"#faf5ff", uniswap:"#fdf4ff",
  litecoin:"#fff7ed", near:"#f0fdf4", aptos:"#fff7ed", sui:"#fefce8",
  "fetch-ai":"#f0fdf4", pepe:"#f0fdf4", "shiba-inu":"#eff6ff", toncoin:"#eff6ff",
  "internet-computer":"#faf5ff", "bitcoin-cash":"#f0fdf4", "wrapped-bitcoin":"#fefce8",
  "usd-coin":"#f0fdf4", matic:"#faf5ff",
  tether:"#f0fdf4",
};

export function useCryptoData(refreshInterval = 30000) {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const ids = Object.keys(PAIR_MAP).join(",");
      const url = `${BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=25&page=1&sparkline=true&price_change_percentage=24h`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mapped = data.map((c) => ({
        id: c.id,
        icon: ICON_MAP[c.id] || "●",
        bg: BG_MAP[c.id] || "#f3f4f6",
        name: c.symbol.toUpperCase(),
        symbol: c.symbol.toUpperCase(),
        fullName: c.name,
        pair: PAIR_MAP[c.id] || `${c.symbol.toUpperCase()}/USDT`,
        lastPrice: c.current_price,
        change: c.price_change_percentage_24h ?? 0,
        high: c.high_24h,
        low: c.low_24h,
        volume: c.total_volume,
        marketCap: c.market_cap,
        sparkline: c.sparkline_in_7d?.price ?? [],
        pos: (c.price_change_percentage_24h ?? 0) >= 0,
        image: c.image,
      }));

      setCoins(mapped);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchData, refreshInterval]);

  return { coins, loading, error, lastUpdated, refetch: fetchData };
}

// Format price nicely
export function fmtPrice(n) {
  if (n === null || n === undefined) return "—";
  if (n < 0.0001) return "$" + n.toFixed(8);
  if (n < 0.01)   return "$" + n.toFixed(6);
  if (n < 1)      return "$" + n.toFixed(4);
  if (n < 1000)   return "$" + n.toFixed(2);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtVolume(n) {
  if (!n) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(0);
}
