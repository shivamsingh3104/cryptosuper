// Server-side coin registry.
// Client ka price/amount KABHI bharosa nahi kiya jata —
// backend hamesha CoinGecko se khud price fetch karta hai.

export const COIN_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  TRX: "tron",
  AVAX: "avalanche",
  LINK: "chainlink",
  DOT: "polkadot",
  UNI: "uniswap",
  LTC: "litecoin",
  NEAR: "near",
  APT: "aptos",
  SUI: "sui",
  FET: "fetch-ai",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  TON: "toncoin",
  ICP: "internet-computer",
  BCH: "bitcoin-cash",
  WBTC: "wrapped-bitcoin",
  MATIC: "matic",
};

// "USDT" -> "balance", "BTC" -> "BTCBalance"
export function balanceKey(symbol) {
  const s = normalizeSymbol(symbol);
  return s === "USDT" ? "balance" : `${s}Balance`;
}

// Ek user doc se coin ka balance padhta hai.
//
// USDT ke liye do fields chal sakti hain: nayi "balance" aur purani legacy
// "USDTBalance". Wallet page dono ko jodkar dikhata tha, lekin withdraw aur
// approve sirf "balance" padhte the — user ko paisa dikhta tha par withdraw
// "Insufficient balance" fail ho jata tha. Isliye har read yahan se jaata hai.
export function coinBalance(userData, symbol) {
  const s = normalizeSymbol(symbol);
  if (s === "USDT") {
    return Number(userData?.balance ?? 0) + Number(userData?.USDTBalance ?? 0);
  }
  return Number(userData?.[`${s}Balance`] ?? 0);
}

// Legacy "USDTBalance" kitna bacha hai — approve ke waqt "balance" me migrate
// kar dete hain taaki balance negative na ho.
export function legacyUsdt(userData) {
  return Number(userData?.USDTBalance ?? 0);
}

export function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

export function isSupported(symbol) {
  return Object.prototype.hasOwnProperty.call(COIN_IDS, normalizeSymbol(symbol));
}
