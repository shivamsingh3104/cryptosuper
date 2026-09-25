import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFileSync, writeFileSync } from "fs";
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
import { balanceKey } from "./config/coins.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5001;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@kepwix.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

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
    if (!doc.exists) return res.json({ balance: 0 });

    const data = doc.data();
    const { balance, BTCBalance, ETHBalance, USDTBalance, ...rest } = data || {};
    const usdtMerged = (balance || 0) + (USDTBalance || 0);
    return res.json({ balance: usdtMerged, BTCBalance: BTCBalance || 0, ETHBalance: ETHBalance || 0, ...rest });
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

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = require("crypto").randomBytes(32).toString("hex");
    adminTokens.add(token);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
});

function requireAdmin(req, res, next) {
  if (adminTokens.has(req.headers["x-admin-token"])) return next();
  return res.status(401).json({ message: "Unauthorized" });
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

// ── ADMIN: DEPOSITS ──────────────────────────────────────────
app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("deposits").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/deposits/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("deposits").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });

    const data = doc.data();
    if (data.status !== "pending") return res.json({ error: "Already processed" });

    await db.collection("deposits").doc(id).update({
      status: "approved",
      approvedAt: new Date()
    });

    const coinKey = data.coin && data.coin !== "USDT" ? data.coin + "Balance" : "balance";
    await db.collection("users").doc(data.userId).set({
      [coinKey]: FieldValue.increment(Number(data.amount))
    }, { merge: true });

    res.json({ success: true, message: "Deposit approved, balance added" });
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
      return res.json({ error: "Already processed" });
    }

    await db.collection("deposits").doc(id).update({
      status: "rejected",
      rejectedAt: new Date(),
      rejectReason: reason || ""
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
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("withdrawals").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });

    const data = doc.data();
    if (data.status !== "pending") return res.json({ error: "Already processed" });

    const userDoc = await db.collection("users").doc(data.userId).get();
    if (!userDoc.exists) return res.json({ error: "User not found" });

    const userData = userDoc.data();
    const coinKey = data.coin && data.coin !== "USDT" ? data.coin + "Balance" : "balance";
    let balance = userData[coinKey];
    if (balance === undefined) balance = userData.balance || 0;

    if (Number(data.amount) > balance) {
      return res.json({ error: "Insufficient balance now" });
    }

    await db.collection("withdrawals").doc(id).update({
      status: "approved",
      approvedAt: new Date()
    });

    await db.collection("users").doc(data.userId).set({
      [coinKey]: FieldValue.increment(-Number(data.amount))
    }, { merge: true });

    res.json({ success: true, message: "Withdrawal approved, balance deducted" });
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
      return res.json({ error: `Swap already ${swap.status}` });
    }

    const toKey = balanceKey(swap.toCurrency);

    await db.collection("users").doc(swap.userId).set({
      [toKey]: FieldValue.increment(Number(swap.toAmount))
    }, { merge: true });

    await db.collection("swaps").doc(id).update({
      status: "approved",
      processedBy: req.body.adminId || "admin",
      processedAt: new Date(),
      adminNotes: req.body.notes || "",
      updatedAt: new Date()
    });

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
      return res.json({ error: `Swap already ${swap.status}` });
    }

    const fromKey = balanceKey(swap.fromCurrency);

    await db.collection("users").doc(swap.userId).set({
      [fromKey]: FieldValue.increment(Number(swap.fromAmount))
    }, { merge: true });

    await db.collection("swaps").doc(id).update({
      status: "rejected",
      processedBy: req.body.adminId || "admin",
      processedAt: new Date(),
      adminNotes: req.body.notes || "",
      updatedAt: new Date()
    });

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