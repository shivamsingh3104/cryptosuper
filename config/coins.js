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

export function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

export function isSupported(symbol) {
  return Object.prototype.hasOwnProperty.call(COIN_IDS, normalizeSymbol(symbol));
}
