import axios from "axios";
import { COIN_IDS, normalizeSymbol } from "./coins.js";

const CACHE_TTL_MS = 30_000;
const CACHE_MAX_STALE_MS = 10 * 60_000;

let cache = { at: 0, prices: {} };

function idToSymbol(id) {
  return Object.keys(COIN_IDS).find((s) => COIN_IDS[s] === id);
}

/**
 * Server-side USD prices from CoinGecko.
 * Fail-closed: agar price na mila to error — kabhi bhi client ka
 * diya hua amount/price fallback me use nahi hota.
 */
export async function getUsdPrices() {
  const now = Date.now();

  if (now - cache.at < CACHE_TTL_MS && Object.keys(cache.prices).length) {
    return cache.prices;
  }

  // stale cache use karo agar CoinGecko down hai, lekin bohat purana nahi
  if (now - cache.at < CACHE_MAX_STALE_MS && Object.keys(cache.prices).length) {
    try {
      return await fetchFresh();
    } catch {
      return cache.prices;
    }
  }

  return fetchFresh();
}

async function fetchFresh() {
  const ids = [...new Set(Object.values(COIN_IDS))].join(",");

  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price",
    { params: { ids, vs_currencies: "usd" }, timeout: 10_000 }
  );

  const prices = {};
  for (const [id, row] of Object.entries(data || {})) {
    const symbol = idToSymbol(id);
    const usd = row?.usd;
    if (symbol && typeof usd === "number" && usd > 0) {
      prices[symbol] = usd;
    }
  }

  if (!Object.keys(prices).length) {
    throw new Error("Price feed unavailable");
  }

  cache = { at: Date.now(), prices };
  return prices;
}

export async function getUsdPrice(symbol) {
  const s = normalizeSymbol(symbol);
  if (!Object.prototype.hasOwnProperty.call(COIN_IDS, s)) {
    throw new Error(`Unsupported coin: ${s}`);
  }
  const prices = await getUsdPrices();
  const p = prices[s];
  if (!p) throw new Error(`No live price for ${s}`);
  return p;
}
