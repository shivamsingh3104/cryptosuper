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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@kepwix.com";
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

// FRONTEND_URL me comma-separated multiple origins daal sakte ho,
// e.g. "https://kepwix.com,https://www.kepwix.com"
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
    "[SECURITY] ALLOW_LEGACY_ADMIN_TOKEN=true — shared-secret admin auth ON hai. " +
      "Ye sirf turant bundle migrate karne ke liye hai, warna koi bhi admin ban sakta hai."
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

// ── COINGECKO PRICE PROXY (cached) ────────────────────────────
// Pehle har page browser se seedha CoinGecko call karta tha — 9 alag endpoints,
// kuch `per_page=250` jaise bhaari. Free tier ise aggressively rate-limit karta
// hai (429/CORS ERR_FAILED), aur jab call fail hoti thi to page ka coin list
// khaali ho jata tha. Usse user ka BALANCE bhi render nahi hota tha, kyunki
// rows CoinGecko list se banti thi — balance API se aata tha. Yaani price feed
// fail hone par user ko apna paisa invisible dikhta tha.
//
// Isliye price ab server side se aati hai, ek jagah cache hoti hai, aur browser
// ko CORS/rate-limit ka koi risk nahi. Coin list khaali hone par bhi client
// local registry se rows bana leta hai.

const PRICE_TTL_MS = 60_000;
let priceCache = { at: 0, data: null };

async function fetchCoinGeckoMarkets(ids, perPage = 250) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`
    + (ids && ids.length ? `&ids=${encodeURIComponent(ids.join(","))}` : "");
  const r = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error("CoinGecko: bad payload");
  return data;
}

// GET /api/prices?ids=bitcoin,ethereum   (ids optional = top 250)
app.get("/api/prices", async (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 250);

  // ids ke saath cache mat karo — har alag combination ke liye alag key chahiye.
  const cacheKey = ids.length ? ids.slice().sort().join(",") : "__all__";
  if (priceCache.data && priceCache.key === cacheKey && Date.now() - priceCache.at < PRICE_TTL_MS) {
    return res.json({ prices: priceCache.data, cached: true });
  }

  try {
    const data = await fetchCoinGeckoMarkets(ids, ids.length ? Math.max(ids.length, 25) : 250);
    const prices = {};
    for (const c of data) {
      prices[c.id] = {
        id: c.id,
        symbol: (c.symbol || "").toUpperCase(),
        name: c.name,
        image: c.image,
        current_price: c.current_price,
        market_cap: c.market_cap,
        total_volume: c.total_volume,
        price_change_percentage_24h: c.price_change_percentage_24h,
      };
    }
    priceCache = { at: Date.now(), key: cacheKey, data: prices };
    res.json({ prices, cached: false });
  } catch (err) {
    // Price fail ho jaye to stale cache bhej do (purana data better hai kisi
    // data se), aur error status mat bhejo — warna UI rows hi khaali kar deta hai.
    if (priceCache.data) {
      return res.json({ prices: priceCache.data, cached: true, stale: true, error: err.message });
    }
    res.status(200).json({ prices: {}, cached: false, error: err.message });
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
  console.log(`✅ KepWix Backend running on http://localhost:${PORT}`);
  console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});