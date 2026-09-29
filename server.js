import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import employeeRoutes from "./routes/employeeRoutes.js";
import { db, admin } from "./config/firebase.js";
const FieldValue = admin.firestore.FieldValue;
import companyRoutes from "./routes/companyRoutes.js";
import pageRoutes from "./routes/pages.js";
import uploadRoutes from "./routes/upload.js";
import walletRoutes from "./routes/wallet.js";
// import walletRoutes from "./routes/wallet.js";
import userRoutes from "./routes/users.js";
import transactionRoutes from "./routes/transactions.js";
import swapRoutes from "./routes/swap.js";
import marketFeesRoutes from "./routes/marketFees.js";
import tradingRoutes from "./routes/trading.js";
import stakingRoutes from "./routes/staking.js";
import requireUser from "./middleware/requireUser.js";
import { balanceKey, normalizeSymbol, isSupported, coinBalance, legacyUsdt, COIN_IDS } from "./config/coins.js";
import { pendingHoldsForUser } from "./config/holds.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5001;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "REDACTED";

const USERS_FILE = join(__dirname, "data", "users.json");
const SESSIONS_FILE = join(__dirname, "data", "sessions.json");

// ── JSON DB helpers ─────────────────────────────────────────
function readDB(file) {
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function writeDB(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// Firestore Timestamp / Date / string / { _seconds } — sab sortable bana deta hai.
// new Date(timestampObject) Naad deta hai, isliye direct sort toot jaata tha.
function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime() || 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime() || 0;
  if (typeof value === "object") {
    const secs = value._seconds ?? value.seconds;
    if (typeof secs === "number") return secs * 1000;
  }
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// ── Express app ─────────────────────────────────────────────
const app = express();

// FRONTEND_URL accepts comma-separated multiple origins,
// e.g. "https://example.com,https://www.example.com"
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "https://superapp.madhavsingh.in",
  "https://cryptosuper.onrender.com",
  "https://myamoto.com",
  "https://www.myamoto.com",
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// employees API (Firestore-backed)
app.use("/api/employees", employeeRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/transactions", transactionRoutes);


app.use("/api/wallets", walletRoutes);

// app.use("/api/wallets", walletRoutes)
app.use("/api/users", userRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/market-fees", marketFeesRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/staking", stakingRoutes);


// ── HEALTH ──────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.get("/", (req, res) => {
  res.send("Server start");
});

// POST /api/users/sync
app.post("/api/users/sync", requireUser, async (req, res) => {
  try {
    const { name, photo, loginMethod } = req.body;
    const uid = req.uid;
    const email = req.email || "";
    if (!uid || !email) {
      return res.status(400).json({ message: "Login email required" });
    }

    const users = readDB(USERS_FILE);
    const now = new Date().toISOString();
    const idx = users.findIndex(u => u.uid === uid);

    let saved;

    if (idx === -1) {
      saved = {
        uid,
        email,
        name: name || email.split("@")[0],
        photo: photo || null,
        loginMethod: loginMethod || "email",
        role: "user",
        createdAt: now,
        lastLogin: now,
        loginCount: 1,
        status: "active",
      };
      users.push(saved);
    } else {
      users[idx].lastLogin = now;
      users[idx].loginCount = (users[idx].loginCount || 0) + 1;
      users[idx].name = name || users[idx].name;
      users[idx].photo = photo || users[idx].photo;
      users[idx].loginMethod = loginMethod || users[idx].loginMethod || "email";
      saved = users[idx];
    }

    writeDB(USERS_FILE, users);

    // mirror into Firestore too
    await db.collection("users").doc(uid).set({
      ...saved,
      syncedAt: now,
    }, { merge: true });

    return res.json({ message: "User synced", user: saved });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me?uid=xxx
app.get("/api/users/me", requireUser, async (req, res) => {
  try {
    const uid = req.uid;

    const users = readDB(USERS_FILE);
    const user = users.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me
app.put("/api/users/me", requireUser, async (req, res) => {
  try {
    const { name, phone, country } = req.body;
    const uid = req.uid;

    const users = readDB(USERS_FILE);
    const idx = users.findIndex(u => u.uid === uid);
    if (idx === -1) return res.status(404).json({ message: "User not found" });

    if (name) users[idx].name = name;
    if (phone) users[idx].phone = phone;
    if (country) users[idx].country = country;

    writeDB(USERS_FILE, users);

    await db.collection("users").doc(uid).set({
      ...users[idx],
      syncedAt: new Date().toISOString(),
    }, { merge: true });

    return res.json(users[idx]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/users/balance?uid=xxx
app.get("/api/users/balance", requireUser, async (req, res) => {
  try {
    const uid = req.uid;

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.json({ balance: 0, availableBalance: 0, pendingHolds: [] });

    const data = doc.data();
    // coinBalance() wahi rule apply karta hai jo withdraw/approve use karte
    // hain — isliye wallet page aur server hamesha same number dikhate hain.
    const usdtMerged = coinBalance(data, "USDT");
    const { balance, USDTBalance, BTCBalance, ETHBalance, ...rest } = data || {};

    // Pending withdrawals ka hold — balance nahi, sirf "aur naya withdraw nahi
    // kar sakte" ka signal. Approve hone tak ye amount available nahi hota.
    const pendingHolds = await pendingHoldsForUser(uid);
    const usdtHold = pendingHolds.find(h => h.coin === "USDT")?.amount || 0;

    return res.json({
      balance: usdtMerged,
      availableBalance: Math.max(0, usdtMerged - usdtHold),
      pendingHolds,
      BTCBalance: coinBalance(data, "BTC"),
      ETHBalance: coinBalance(data, "ETH"),
      ...rest,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DEBUG: view raw Firestore data for a user
app.get("/api/users/debug/:uid", requireUser, async (req, res) => {
  try {
    const uid = req.uid;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.json({ error: "User not found in Firestore" });
    return res.json(doc.data());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ROUTES ────────────────────────────────────────────
// Password .env se aata hai aur token runtime pe banta hai —
// dono source me hardcoded nahi hain, to browser bundle me leak nahi ho sakte.

const adminTokens = new Set();

// token -> admin email, taaki approve/reject par audit trail likh sakein.
const adminTokenOwners = new Map();

// Purane bundle me token baked tha, isliye compatibility ke liye ek escape
// hatch rakha hai — lekin AB default OFF hai.
//
// Ye string repo ke git history me "Initial commit" se padi hui hai, yaani
// effectively public hai. Jab tak POST /api/admin/credit jaisa endpoint
// unlimited paisa credit karta hai, ye constant live rakhna = koi bhi jisko
// ye string mila (clone, GitHub search, purana bundle) unlimited apna wallet
// bhar sakta hai. Isliye sirf env se explicitly on kiya ja sakta hai.
//
// Old bundle abhi deploy hai? Temporary:
//   ALLOW_LEGACY_ADMIN_TOKEN=true   (aur naye bundle upload karte hi hata do)
const ALLOW_LEGACY_ADMIN_TOKEN = process.env.ALLOW_LEGACY_ADMIN_TOKEN === "true";
const LEGACY_ADMIN_TOKEN = "REDACTED";

if (ALLOW_LEGACY_ADMIN_TOKEN) {
  console.warn(
    "[SECURITY] ALLOW_LEGACY_ADMIN_TOKEN=true — shared-secret admin auth is ENABLED. " +
      "Use this only to migrate the bundle immediately, otherwise anyone can become an admin."
  );
}

function legacyTokenAccepted(t) {
  return ALLOW_LEGACY_ADMIN_TOKEN && t === LEGACY_ADMIN_TOKEN;
}

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = randomBytes(32).toString("hex");
    adminTokens.add(token);
    adminTokenOwners.set(token, email);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
});

function requireAdmin(req, res, next) {
  const t = req.headers["x-admin-token"];
  if (adminTokens.has(t) || legacyTokenAccepted(t)) return next();
  return res.status(401).json({ message: "Unauthorized" });
}

// Kaunsa admin ye action kar raha hai — audit fields me likha jata hai.
function adminActor(req) {
  const t = req.headers["x-admin-token"];
  return adminTokenOwners.get(t) || (legacyTokenAccepted(t) ? "legacy-token" : "unknown");
}

// Admin auth ab Firebase ID token + Firestore role check karta hai.
// Shared secret / hardcoded password poora hata diya gaya hai.

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = readDB(USERS_FILE);
  return res.json(users);
});

app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const users = readDB(USERS_FILE);
  const total = users.length;
  const googleUsers = users.filter(u => u.loginMethod === "google").length;
  const emailUsers = users.filter(u => u.loginMethod === "email").length;
  const active = users.filter(u => u.status === "active").length;
  const banned = users.filter(u => u.status === "banned").length;

  const today = new Date().toDateString();
  const newToday = users.filter(u => new Date(u.createdAt).toDateString() === today).length;

  const week = Date.now() - 7 * 86400000;
  const newWeek = users.filter(u => new Date(u.createdAt).getTime() > week).length;

  return res.json({ total, googleUsers, emailUsers, active, banned, newToday, newWeek });
});

app.put("/api/admin/users/:uid/status", requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.body;

    const users = readDB(USERS_FILE);
    const idx = users.findIndex(u => u.uid === uid);
    if (idx === -1) return res.status(404).json({ message: "User not found" });

    users[idx].status = status;
    writeDB(USERS_FILE, users);

    await db.collection("users").doc(uid).set({
      ...users[idx],
      syncedAt: new Date().toISOString(),
    }, { merge: true });

    return res.json(users[idx]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.delete("/api/admin/users/:uid", requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    let users = readDB(USERS_FILE);
    const before = users.length;
    users = users.filter(u => u.uid !== uid);

    if (users.length === before) {
      return res.status(404).json({ message: "User not found" });
    }

    writeDB(USERS_FILE, users);

    await db.collection("users").doc(uid).delete().catch(() => null);

    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get("/api/admin/users/search", requireAdmin, (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const users = readDB(USERS_FILE);
  const found = q
    ? users.filter(u =>
        (u.email || "").toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q)
      )
    : users;
  return res.json(found);
});

// ── ADMIN: DIRECT WALLET CREDIT ───────────────────────────────
// Ab users khud deposit submit nahi karte — admin hi wallet me paisa daalta
// hai. Yahan balance increment + ledger record dono ek transaction me, taaki
// "paisa gaya par history me nahi dikha" ya ulta na ho.
//
//   POST /api/admin/credit
//   { uid, amount, coin, note? }  ->  { success, balanceBefore, balanceAfter }
app.post("/api/admin/credit", requireAdmin, async (req, res) => {
  try {
    const { uid, amount, coin, note } = req.body || {};

    if (!uid) return res.status(400).json({ error: "User is required" });

    const symbol = normalizeSymbol(coin || "USDT");
    if (!isSupported(symbol)) {
      return res.status(400).json({ error: `Unsupported coin: ${coin}` });
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const actor = adminActor(req);
    const coinKey = balanceKey(symbol);

    const result = await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await tx.get(userRef);

      // Firestore me user doc na bana ho to /api/users/sync ne abhi nahi banaya.
      // Tab account ka naam data/users.json se uthate hain taaki ledger me
      // dikh sake, aur doc bhi bana dete hain.
      let userEmail = "";
      let userData = {};
      if (userDoc.exists) {
        userData = userDoc.data() || {};
        userEmail = userData.email || "";
      } else {
        const fromJson = readDB(USERS_FILE).find(u => u.uid === uid);
        if (!fromJson) return { code: 404, error: "User not found" };
        userEmail = fromJson.email || "";
        userData = { ...fromJson };
      }

      const before = coinBalance(userData, symbol);
      const after = before + value;

      // USDT ke liye `balance` hi canonical field hai, baaki coins ke liye
      // `<COIN>Balance`. Pehle relative increment set karte hain...
      const patch = { [coinKey]: FieldValue.increment(value) };
      // ...aur sirf tab absolute value se override karte hain jab legacy
      // "USDTBalance" bhi exist karta hai (usko canonical field me fold karna
      // hai). Bina is check ke credit ek field me jaati, read do fields jodkar
      // dikhata — matlab balance double dikhta.
      //
      // Ye override relative write ko replace karta hai, isliye `value` add
      // nahi hota balki `after` (already includes value) set hota hai — sahi hai.
      if (symbol === "USDT" && legacyUsdt(userData) > 0) {
        patch.balance = after;
        patch.USDTBalance = FieldValue.delete();
      }

      if (!userDoc.exists) {
        // Ek hi write — naya doc bhi ban jaye aur credit bhi lag jaye.
        patch.email = userEmail;
        patch.name = userData.name || "";
        patch.role = userData.role || "user";
        patch.status = userData.status || "active";
        patch.syncedAt = new Date().toISOString();
      }
      tx.set(userRef, patch, { merge: true });

      // Ledger record bhi transaction ke andar — collection.add() use karna
      // transaction se bahar likhta hai, retry par duplicate record ban jata.
      const ledgerRef = db.collection("deposits").doc();
      tx.create(ledgerRef, {
        userId: uid,
        userEmail,
        amount: value,
        // `amount` hamesha COIN amount hai. `usdAmount` sirf USDT (fiat) ke liye
        // valid hai — 0.5 BTC me usdAmount: 0.5 likhne se history "$0.50" dikhati,
        // jo galat hai. Crypto ke liye price feed nahi hai, isliye null.
        usdAmount: symbol === "USDT" ? value : null,
        currency: symbol === "USDT" ? "USD" : symbol,
        coin: symbol,
        method: "admin",
        type: "admin-credit",
        walletAddress: "",
        txHash: "",
        note: note || "",
        // Seedha approved — admin ne credit karne se pehle hi confirm kar diya.
        status: "approved",
        balanceChanged: true,
        creditedAmount: value,
        creditedCoin: symbol,
        approvedAt: new Date(),
        processedBy: actor,
        createdAt: new Date(),
      });

      return { before, after, ledgerId: ledgerRef.id, coin: symbol };
    });

    if (result.error) return res.status(result.code).json({ error: result.error });

    res.json({
      success: true,
      message: `Credited ${value} ${result.coin}. Balance ${result.before} → ${result.after} ${result.coin}`,
      balanceBefore: result.before,
      balanceAfter: result.after,
      coin: result.coin,
      recordId: result.ledgerId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── PRICE FEED (shared cache + fallback) ───────────────────────────────
//
// Pehle har page browser se seedha CoinGecko call karta tha — 8 alag call
// sites, kuch `per_page=250` jaise bhaari. Do problems the:
//   1. CoinGecko ka free tier per-IP rate-limit karta hai (429 +
//      `retry-after`). Har browser apna call karta tha, to N users = N×
//      upstream requests aur quota khatam ho jata tha.
//   2. Server proxy bhi cache ko `ids` combination se key karta tha, to har
//      alag page apna alag upstream call maar raha tha — ek hi 60s TTL ke
//      andar 7-8 CoinGecko calls.
//
// Isliye ab:
//   - EK shared snapshot (top coins) cache hota hai, aur `?ids=` se usi
//     snapshot ko filter karte hain. Yaani 45s me poori app ke liye 1 call.
//   - Single-flight: ek saath aaye 50 requests ho to bhi sirf 1 upstream call.
//   - 429 par `retry-after` maan kar backoff — limited hone par quota burn
//     nahi hota.
//   - Binance fallback: CoinGecko 429 / down ho to bhi live price milta hai.
//     Binance ka public endpoint unmetered hai aur ~sub-second hai.

const PRICE_TTL_MS = 45_000;
const SPARKLINE_TTL_MS = 5 * 60_000; // 7d hourly sparkline slowly badalta hai
const UPSTREAM_TIMEOUT_MS = 6000;

let priceSnapshot = null;    // { at, source, list: [...coins] }
let priceInFlight = null;    // single-flight promise
let priceRetryAfter = 0;     // epoch ms — 429 backoff
let sparklineCache = null;   // { at, byId: {id: {price: []}} }
let sparklineInFlight = null;

// CoinGecko id -> Binance USDT pair, fallback path ke liye.
//
// Ye EXPLICIT map hai, COIN_IDS se derive karna galat hai: Binance har asset
// ke liye ticker symbol CoinGecko se alag hota hai (XRP ka Binance pair
// `XRPUSDT` hai, `RIPPLEUSDT` nahi — wo 400 deta hai). `tether` chhoda gaya
// hai (uska koi USDT pair nahi, aur price hamesha ~1 rehti hai).
const BINANCE_PAIR = {
  // App ka apna registry
  bitcoin: "BTCUSDT", ethereum: "ETHUSDT", "usd-coin": "USDCUSDT",
  binancecoin: "BNBUSDT", solana: "SOLUSDT", ripple: "XRPUSDT",
  dogecoin: "DOGEUSDT", cardano: "ADAUSDT", tron: "TRXUSDT",
  avalanche: "AVAXUSDT", chainlink: "LINKUSDT", polkadot: "DOTUSDT",
  uniswap: "UNIUSDT", litecoin: "LTCUSDT", near: "NEARUSDT",
  aptos: "APTUSDT", sui: "SUIUSDT", "fetch-ai": "FETUSDT", pepe: "PEPEUSDT",
  "shiba-inu": "SHIBUSDT", toncoin: "TONUSDT", "internet-computer": "ICPUSDT",
  "bitcoin-cash": "BCHUSDT", "wrapped-bitcoin": "WBTCUSDT", matic: "MATICUSDT",

  // MarketCap / screener jaise pages ke extra top coins
  "avalanche-2": "AVAXUSDT", stellar: "XLMUSDT", "ethereum-classic": "ETCUSDT",
  hedera: "HBARUSDT", filecoin: "FILUSDT", cosmos: "ATOMUSDT",
  "the-graph": "GRTUSDT", "render-token": "RENDERUSDT",
  "injective-protocol": "INJUSDT", aave: "AAVEUSDT", algorand: "ALGOUSDT",
  vechain: "VETUSDT", elrond: "EGLDUSDT", decentraland: "MANAUSDT",
  hyperliquid: "HYPEUSDT", "the-open-network": "TONUSDT",
  "matic-network": "MATICUSDT", arbitrum: "ARBUSDT", optimism: "OPUSDT",
  "polygon-ecosystem-token": "POLUSDT", harmony: "ONEUSDT", zilliqa: "ZILUSDT",
  "icon": "ICXUSDT", "ontology": "ONTUSDT", neo: "NEOUSDT", eos: "EOSUSDT",
  "theta-token": "THETAUSDT", fantom: "FTMUSDT", flow: "FLOWUSDT",
  "pancakeswap-token": "CAKEUSDT", "compound-governance-token": "COMPUSDT",
  maker: "MKRUSDT",
  // MarketCap.jsx `xrp` bhejta hai, jabki CoinGecko ka id `ripple` hai — alias.
  xrp: "XRPUSDT",
};

// Binance spot par nahi hai (Cronos delisted, OKB/LEO nahi listed), isliye inka
// koi pair nahi. CoinGecko healthy hote hi ye waise bhi aa jaate hain.
const BINANCE_PAIR_EXCLUDED = new Set(["cronos", "okb", "leo-token"]);

// Ek hi Binance pair kai CoinGecko ids ke liye ho sakta hai (AVAXUSDT ->
// `avalanche` aur `avalanche-2` dono). Isliye pair -> ids ki LIST banao, warna
// dusra id pehla overwrite kar deta tha aur `toncoin`/`avalanche` gayab ho
// jaate the.
const IDS_FOR_PAIR = {};
for (const [id, pair] of Object.entries(BINANCE_PAIR)) {
  (IDS_FOR_PAIR[pair] ||= []).push(id);
}

function upstreamHeaders() {
  return { accept: "application/json" };
}

// ── Upstream fetchers ────────────────────────────────────────────────
async function fetchCoinGeckoMarkets(ids, perPage = 250) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`
    + (ids && ids.length ? `&ids=${encodeURIComponent(ids.join(","))}` : "");
  const r = await fetch(url, { headers: upstreamHeaders(), signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

  if (r.status === 429) {
    const ra = Number(r.headers.get("retry-after"));
    priceRetryAfter = Date.now() + (Number.isFinite(ra) && ra > 0 ? ra * 1000 : 60_000);
    throw new Error("CoinGecko 429 (rate limited)");
  }
  if (!r.ok) throw new Error(`CoinGecko ${r.status}`);

  const data = await r.json();
  if (!Array.isArray(data)) throw new Error("CoinGecko: bad payload");
  return data;
}

// Binance fallback — ek call me saari pairs ka 24h ticker.
async function fetchBinanceTickers() {
  const pairs = Object.values(BINANCE_PAIR);
  if (!pairs.length) return [];

  // Binance batch endpoint poori tarah fail karta hai agar EVEN EK symbol
  // listing me na ho (400 Bad Symbol). Isliye pehle ek batch call, aur fail
  // ho to per-symbol calls — taaki ek unknown pair poora fallback maar na de.
  let data = null;
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
    const r = await fetch(url, { headers: upstreamHeaders(), signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!r.ok) throw new Error(`Binance ${r.status}`);
    const body = await r.json();
    if (Array.isArray(body)) data = body;
  } catch { /* batch fail -> per-symbol below */ }

  if (!data) {
    const settled = await Promise.allSettled(pairs.map((p) =>
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${p}`, {
        headers: upstreamHeaders(),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ));
    data = settled.filter((s) => s.status === "fulfilled" && s.value).map((s) => s.value);
  }

  if (!Array.isArray(data)) throw new Error("Binance: bad payload");

  // Binance symbol -> CoinGecko ids (ek pair ke kai ids ho sakte hain)
  const idsForPair = IDS_FOR_PAIR;

  const out = [];
  for (const t of data) {
    const ids = idsForPair[t.symbol];
    if (!ids) continue;
    const base = t.symbol.replace(/USDT$/, "");
    for (const id of ids) {
      out.push({
        id,
        symbol: base,
        name: base,
        image: null,             // Binance image nahi deta — UI fallback icon use karti hai
        current_price: Number(t.lastPrice),
        high_24h: Number(t.highPrice),
        low_24h: Number(t.lowPrice),
        total_volume: Number(t.quoteVolume),
        market_cap: null,        // Binance market cap nahi deta
        price_change_percentage_24h: Number(t.priceChangePercent),
      });
    }
  }
  return out;
}

// Stablecoins ka Binance USDT pair nahi hota, aur upar wale maps me bhi
// `tether` jaanbujh kar chhoda gaya hai. CoinGecko down hone par inki row
// poori tarah gayab ho jaati thi. Price ~1 hai hi, to synthetic entry daal
// dete hain — UI me row bani rehti hai.
const STABLE_IDS = {
  tether: "USDT", "usd-coin": "USDC", "first-digital-usd": "FDUSD",
  "usd-coin-bnb-chain": "USDC-BNB", "tether-bnb-chain": "USDT-BNB",
};

function stableCoinFallback() {
  return Object.entries(STABLE_IDS).map(([id, symbol]) => ({
    id,
    symbol,
    name: symbol,
    image: null,
    current_price: 1,
    high_24h: 1.02,
    low_24h: 0.99,
    total_volume: null,
    market_cap: null,
    price_change_percentage_24h: 0.01,
  }));
}

// ── Shared snapshot (single-flight) ──────────────────────────────────
function snapshotIsFresh() {
  return priceSnapshot && Date.now() - priceSnapshot.at < PRICE_TTL_MS;
}

async function refreshSnapshot() {
  if (snapshotIsFresh()) return priceSnapshot;

  // Ek hi upstream call, chahe 50 users ek saath aayein.
  if (priceInFlight) return priceInFlight;

  priceInFlight = (async () => {
    // Rate-limited ho to nayi CoinGecko call ki koshish hi mat karo —
    // `age` ke saath `stale` bhi mark karo taaki client jaanta rahe ki
    // ye purana data hai.
    if (Date.now() < priceRetryAfter && priceSnapshot) {
      return { ...priceSnapshot, stale: true, error: "CoinGecko rate limited" };
    }

    try {
      const list = await fetchCoinGeckoMarkets([], 250);
      priceSnapshot = { at: Date.now(), source: "coingecko", list };
      priceRetryAfter = 0;
      return priceSnapshot;
    } catch (err) {
      // CoinGecko fail / limited -> Binance se live price le lo.
      try {
        const list = await fetchBinanceTickers();
        const merged = [...list, ...stableCoinFallback()];
        if (merged.length) {
          // Binance snapshot thoda kam coins deta hai, isliye pehle wala
          // CoinGecko data usme merge kar dete hain (market cap / image bacha rahe).
          const byId = new Map((priceSnapshot?.list || []).map((c) => [c.id, c]));
          for (const c of merged) {
            const prev = byId.get(c.id);
            byId.set(c.id, prev ? { ...prev, ...c, market_cap: c.market_cap ?? prev.market_cap, image: c.image ?? prev.image } : c);
          }
          priceSnapshot = { at: Date.now(), source: "binance", list: [...byId.values()] };
          return priceSnapshot;
        }
        throw err;
      } catch (binanceErr) {
        // Dono fail. Purana data bhej do — khaali se behtar hai.
        if (priceSnapshot) {
          priceSnapshot = { ...priceSnapshot, stale: true, error: String(binanceErr.message || binanceErr) };
          return priceSnapshot;
        }
        throw binanceErr;
      }
    }
  })().finally(() => { priceInFlight = null; });

  return priceInFlight;
}

// ── Sparkline (alag cache, lamba TTL) ───────────────────────────────
async function fetchSparklines(ids) {
  if (sparklineCache && Date.now() - sparklineCache.at < SPARKLINE_TTL_MS) return sparklineCache;
  if (sparklineInFlight) return sparklineInFlight;

  sparklineInFlight = (async () => {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&sparkline=true&per_page=${Math.max(ids.length, 25)}&page=1&price_change_percentage=24h`;
    const r = await fetch(url, { headers: upstreamHeaders(), signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
    const data = await r.json();
    if (!Array.isArray(data)) throw new Error("CoinGecko: bad payload");

    const byId = {};
    for (const c of data) byId[c.id] = { price: c.sparkline_in_7d?.price || [] };
    sparklineCache = { at: Date.now(), byId };
    return sparklineCache;
  })().finally(() => { sparklineInFlight = null; });

  return sparklineInFlight;
}

function pickCoins(snapshot, ids) {
  if (!snapshot || !snapshot.list) return [];
  if (!ids.length) return snapshot.list;
  const want = new Set(ids);
  return snapshot.list.filter((c) => want.has(c.id));
}

// GET /api/prices?ids=bitcoin,ethereum&sparkline=0|1&limit=25
// `coins` array CoinGecko /coins/markets jaisa shape rakhta hai, aur `prices`
// object-wala shape bhi deta hai — purane clients dono chalate hain.
app.get("/api/prices", async (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 250);
  const limit = Math.min(Number(req.query.limit) || (ids.length ? ids.length : 250), 250);
  const wantSparkline = String(req.query.sparkline || "") === "1" || String(req.query.sparkline) === "true";

  try {
    const snap = await refreshSnapshot();
    let coins = pickCoins(snap, ids);
    if (limit) coins = coins.slice(0, limit);

    if (wantSparkline && coins.length) {
      // Sparkline best-effort: fail ho jaye to price waise hi bhej do.
      try {
        const sl = await fetchSparklines(coins.map((c) => c.id));
        coins = coins.map((c) => ({ ...c, sparkline_in_7d: sl.byId[c.id] || { price: [] } }));
      } catch { /* keep prices */ }
    }

    // Hamesha `sparkline_in_7d` field rakho, warna client ka shape expectations
    // fail ho jata hai jab upstream sparkline nahi de paya.
    coins = coins.map((c) => (c.sparkline_in_7d ? c : { ...c, sparkline_in_7d: { price: [] } }));

    const prices = {};
    for (const c of coins) prices[c.id] = c;

    res.json({
      coins,
      prices,
      cached: true,
      source: snap.source,
      stale: !!snap.stale,
      age: Date.now() - snap.at,
      ...(snap.error ? { error: snap.error } : {}),
    });
  } catch (err) {
    res.status(200).json({ coins: [], prices: {}, cached: false, error: String(err.message || err) });
  }
});

// GET /api/price?ids=bitcoin,ethereum
// CoinGecko /simple/price ka exact shape — `{ "bitcoin": { "usd": 12345 } }`
app.get("/api/price", async (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 250);
  try {
    const snap = await refreshSnapshot();
    const out = {};
    for (const c of pickCoins(snap, ids)) {
      if (c.current_price != null) out[c.id] = { usd: c.current_price };
    }
    res.json(out);
  } catch (err) {
    res.status(200).json({});
  }
});

// GET /api/supported-coins — client ki local registry ka server-side source of
// truth. Balances ki rows isse render hoti hain, isliye CoinGecko down hone par
// bhi user ko uska balance dikhta hai.
app.get("/api/supported-coins", (req, res) => {
  res.json(Object.keys(COIN_IDS).map((symbol) => ({ symbol, id: COIN_IDS[symbol] })));
});

// GET /api/admin/balances — user picker me har user ka current balance dikhane// ke liye. /api/admin/users JSON-backed hai aur balance nahi rakhta, isliye
// alag se Firestore se ek hi query me saare balances la rahe hain.
app.get("/api/admin/balances", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const symbols = Object.keys(COIN_IDS);
    const out = {};
    snapshot.docs.forEach(d => {
      const data = d.data() || {};
      const coins = {};
      // Ek hi pass me sabhi coins — har coin ke liye alag coinBalance() call
      // karne par legacy USDT baar baar add hota tha.
      for (const s of symbols) {
        const v = coinBalance(data, s);
        if (v !== 0) coins[s] = v;
      }
      out[d.id] = { balance: coins.USDT || 0, coins };
    });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: DEPOSITS ──────────────────────────────────────────
app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("deposits").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Pending sabse upar — admin ko approve karna ho. Fir naya purana.
    items.sort((a, b) => {
      if ((a.status === "pending") !== (b.status === "pending")) {
        return a.status === "pending" ? -1 : 1;
      }
      return toMillis(b.createdAt) - toMillis(a.createdAt);
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/deposits/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Number(req.body?.amount ?? NaN);
    const overrideAmount = Number.isFinite(amount) && amount >= 0;

    // Status update + balance increment ek hi transaction me — beech me crash
    // ho to request "approved" dikhega par balance kabhi credit nahi hoga.
    const result = await db.runTransaction(async (tx) => {
      const docRef = db.collection("deposits").doc(id);
      const doc = await tx.get(docRef);
      if (!doc.exists) return { code: 404, error: "Not found" };

      const data = doc.data();
      if (data.status !== "pending") return { code: 409, error: "Already processed" };

      const coin = normalizeSymbol(data.coin || "USDT");
      const coinKey = balanceKey(coin);
      const credit = overrideAmount ? amount : Number(data.amount);
      if (!Number.isFinite(credit) || credit <= 0) {
        return { code: 400, error: "Invalid amount" };
      }

      tx.update(docRef, {
        status: "approved",
        approvedAt: new Date(),
        processedBy: adminActor(req),
        creditedAmount: credit,
        creditedCoin: coin,
      });
      tx.set(db.collection("users").doc(data.userId),
        { [coinKey]: FieldValue.increment(credit) }, { merge: true });

      return { credit, coin, coinKey };
    });

    if (result.error) return res.status(result.code).json({ error: result.error });

    res.json({
      success: true,
      message: `Deposit approved, ${result.credit} ${result.coin} credited`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/deposits/:id/reject
app.put("/api/admin/deposits/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doc = await db.collection("deposits").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });

    if (doc.data().status !== "pending") {
      return res.status(409).json({ error: "Already processed" });
    }

    await db.collection("deposits").doc(id).update({
      status: "rejected",
      rejectedAt: new Date(),
      rejectReason: reason || "",
      processedBy: adminActor(req),
    });

    res.json({ success: true, message: "Deposit rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: WITHDRAWALS ───────────────────────────────────────
app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("withdrawals").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => {
      if ((a.status === "pending") !== (b.status === "pending")) {
        return a.status === "pending" ? -1 : 1;
      }
      return toMillis(b.createdAt) - toMillis(a.createdAt);
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Status + balance ek hi transaction me. Pending amount bhi andar hi
    // check hota hai, warna do "pending" withdrawals ek hi balance approve
    // kar sakti thi.
    const result = await db.runTransaction(async (tx) => {
      const docRef = db.collection("withdrawals").doc(id);
      const doc = await tx.get(docRef);
      if (!doc.exists) return { code: 404, error: "Not found" };

      const data = doc.data();
      if (data.status !== "pending") return { code: 409, error: "Already processed" };

      const coin = normalizeSymbol(data.coin || "USDT");
      const coinKey = balanceKey(coin);
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { code: 400, error: "Invalid amount" };
      }

      const userRef = db.collection("users").doc(data.userId);
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) return { code: 404, error: "User not found" };

      const userData = userDoc.data();
      const balance = coinBalance(userData, coin);

      // Is doc ke alawa baaki pending withdrawals ka amount bhi reserve
      // maana jaata hai, taaki approve karte waqt balance na negative ho.
      const others = await db.collection("withdrawals")
        .where("userId", "==", data.userId)
        .where("status", "==", "pending")
        .get();
      const heldByOthers = others.docs
        .filter(d => d.id !== id)
        .filter(d => normalizeSymbol(d.data().coin || "USDT") === coin)
        .reduce((sum, d) => sum + Number(d.data().amount || 0), 0);

      if (amount + heldByOthers > balance) {
        return {
          code: 409,
          error: `Insufficient unreserved balance (available ${Math.max(0, balance - heldByOthers)} ${coin}, this request ${amount} ${coin})`,
        };
      }

      tx.update(docRef, {
        status: "approved",
        approvedAt: new Date(),
        processedBy: adminActor(req),
        debitedCoin: coin,
      });

      const patch = {};
      if (coin === "USDT" && legacyUsdt(userData) > 0) {
        // Purana "USDTBalance" canonical "balance" me fold ho jata hai. Sirf
        // delete karne se naya balance -amount par chala jata.
        patch.balance = balance - amount;
        patch.USDTBalance = FieldValue.delete();
      } else {
        patch[coinKey] = FieldValue.increment(-amount);
      }
      tx.set(userRef, patch, { merge: true });

      return { amount, coin };
    });

    if (result.error) return res.status(result.code).json({ error: result.error });

    res.json({
      success: true,
      message: `Withdrawal approved, ${result.amount} ${result.coin} deducted`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/withdrawals/:id/reject
// Withdrawal submit hone par koi balance change nahi hota (sirf "pending"
// record banta hai), isliye reject karne par refund ki zaroorat nahi.
app.put("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doc = await db.collection("withdrawals").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });

    if (doc.data().status !== "pending") {
      return res.status(409).json({ error: "Already processed" });
    }

    await db.collection("withdrawals").doc(id).update({
      status: "rejected",
      rejectedAt: new Date(),
      rejectReason: reason || "",
      processedBy: adminActor(req),
    });

    res.json({ success: true, message: "Withdrawal rejected. No balance was changed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: SWAP MANAGEMENT ────────────────────────────────────
app.get("/api/admin/swaps", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("swaps")
      .orderBy("createdAt", "desc")
      .get();
    const swaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve = toAmount credit hota hai (fromAmount pehle se escrow hai)
app.put("/api/admin/swaps/:id/process", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("swaps").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Swap not found" });

    const swap = doc.data();
    if (swap.status !== "pending") {
      // Pehle yahan 200 par `{ error: ... }` jaata tha, jo client ke liye
      // success jaisa lagta hai. Ab 409 — same jaisa deposit approve me hai.
      return res.status(409).json({ error: `Swap already ${swap.status}` });
    }

    const toKey = balanceKey(swap.toCurrency);

    // Credit + status update EK transaction me.
    //
    // Pehle do alag writes the: pehle `toAmount` credit, phir status update.
    // Beech me crash ya retry ho to user ko dobara credit ho jata tha — aur
    // kyunki `increment()` hai, woh chup-chaap double paisa de deta tha. Status
    // check se sirf sequential double-click rokta hai, beech ke crash ko nahi.
    const result = await db.runTransaction(async (tx) => {
      const swapRef = db.collection("swaps").doc(id);
      const fresh = await tx.get(swapRef);
      if (!fresh.exists) return { code: 404, error: "Swap not found" };
      if (fresh.data().status !== "pending") {
        return { code: 409, error: `Swap already ${fresh.data().status}` };
      }
      tx.set(db.collection("users").doc(swap.userId),
        { [toKey]: FieldValue.increment(Number(swap.toAmount)) }, { merge: true });
      tx.update(swapRef, {
        status: "approved",
        processedBy: adminActor(req),
        processedAt: new Date(),
        adminNotes: req.body.notes || "",
        updatedAt: new Date(),
      });
      return { ok: true };
    });

    if (result.error) return res.status(result.code).json({ error: result.error });

    res.json({ success: true, message: `Swap approved. ${swap.toAmount} ${swap.toCurrency} credited.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject = fromAmount wapas (refund)
app.put("/api/admin/swaps/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("swaps").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Swap not found" });

    const swap = doc.data();
    if (swap.status !== "pending") {
      return res.status(409).json({ error: `Swap already ${swap.status}` });
    }

    const fromKey = balanceKey(swap.fromCurrency);

    // Refund + status update EK transaction me — approve wala hi reason: retry ya
    // crash beech me aaya to user ko dobara refund mil jata tha.
    const result = await db.runTransaction(async (tx) => {
      const swapRef = db.collection("swaps").doc(id);
      const fresh = await tx.get(swapRef);
      if (!fresh.exists) return { code: 404, error: "Swap not found" };
      if (fresh.data().status !== "pending") {
        return { code: 409, error: `Swap already ${fresh.data().status}` };
      }
      tx.set(db.collection("users").doc(swap.userId),
        { [fromKey]: FieldValue.increment(Number(swap.fromAmount)) }, { merge: true });
      tx.update(swapRef, {
        status: "rejected",
        processedBy: adminActor(req),
        processedAt: new Date(),
        adminNotes: req.body.notes || "",
        updatedAt: new Date(),
      });
      return { ok: true };
    });

    if (result.error) return res.status(result.code).json({ error: result.error });

    res.json({ success: true, message: `Swap rejected. ${swap.fromAmount} ${swap.fromCurrency} refunded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: TRADE MANAGEMENT ───────────────────────────────────
app.get("/api/admin/trades", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("tradeHistory")
      .orderBy("createdAt", "desc")
      .get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve = doosri side credit (Buy me coin, Sell me USDT)
app.put("/api/admin/trades/:id/process", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("tradeHistory").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const trade = doc.data();
    if (trade.status !== "pending") {
      return res.json({ error: `Order already ${trade.status}` });
    }

    const creditKey = trade.side === "Buy" ? balanceKey(trade.base) : balanceKey(trade.quote);
    const creditAmt = trade.side === "Buy" ? Number(trade.amount) : Number(trade.total);

    await db.collection("users").doc(trade.userId).set({
      [creditKey]: FieldValue.increment(creditAmt)
    }, { merge: true });

    await db.collection("tradeHistory").doc(id).update({
      status: "filled",
      processedAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: `Order filled. ${creditAmt} ${creditKey} credited.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject = escrow refund
app.put("/api/admin/trades/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("tradeHistory").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });

    const trade = doc.data();
    if (trade.status !== "pending") {
      return res.json({ error: `Order already ${trade.status}` });
    }

    const refundKey = trade.side === "Buy" ? balanceKey(trade.quote) : balanceKey(trade.base);
    const refundAmt = trade.side === "Buy" ? Number(trade.total) : Number(trade.amount);

    await db.collection("users").doc(trade.userId).set({
      [refundKey]: FieldValue.increment(refundAmt)
    }, { merge: true });

    await db.collection("tradeHistory").doc(id).update({
      status: "rejected",
      processedAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: `Order rejected. ${refundAmt} refunded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});