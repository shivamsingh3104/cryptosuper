import express from "express";
import { db } from "../config/firebase.js";
import requireUser from "../middleware/requireUser.js";
import { normalizeSymbol, isSupported, coinBalance } from "../config/coins.js";
import { pendingWithdrawalsByCoin } from "../config/holds.js";

const router = express.Router();

// ── DEPOSIT (DISABLED) ────────────────────────────────────────
// User deposit flow hata diya gaya hai — ab paisa sirf admin wallet me
// daalta hai (POST /api/admin/credit). Ye endpoints 410 bhejte hain taaki
// koi purana bundle ya direct call credit na kar sake.
//
//   router.post("/submit", ...)   → deposit record
//   router.post("/deposit", ...)  → deposit record
//
// Wapas chahiye to niche wali dono router.post blocks un-comment kar dena.

const DEPOSIT_DISABLED = {
  error: "Self-deposit is disabled. Funds are credited by admin.",
  depositDisabled: true,
};

router.post("/submit", requireUser, (_req, res) => res.status(410).json(DEPOSIT_DISABLED));
router.post("/deposit", requireUser, (_req, res) => res.status(410).json(DEPOSIT_DISABLED));

// ── WITHDRAWAL REQUEST ───────────────────────────────────────
// Sirf "pending" record banta hai — balance ABHI change nahi hota.
// Amount admin approval tak reserve (hold) rehta hai, isliye ek hi balance
// par multiple pending requests nahi ban sakte.
router.post("/withdraw", requireUser, async (req, res) => {
  try {
    const { amount, walletAddress, coin, method } = req.body;
    const userId = req.uid;
    const userEmail = req.email || "";

    if (!userId || !amount || !walletAddress) {
      return res.status(400).json({ error: "Missing withdraw details" });
    }

    const symbol = normalizeSymbol(coin || "USDT");
    if (!isSupported(symbol)) {
      return res.status(400).json({ error: "Unsupported coin" });
    }

    const requested = Number(amount);
    if (!Number.isFinite(requested) || requested <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const userData = userDoc.data();
    const total = coinBalance(userData, symbol);

    const pending = await pendingWithdrawalsByCoin(userId);
    const held = pending[symbol] || 0;
    const available = Math.max(0, total - held);

    if (requested > available) {
      return res.status(409).json({
        error: held > 0
          ? `Insufficient available balance. ${held} ${symbol} is already pending approval.`
          : "Insufficient balance",
        balance: total,
        pending: held,
        available,
      });
    }

    const ref = await db.collection("withdrawals").add({
      userId,
      userEmail: userEmail || "",
      amount: requested,
      walletAddress,
      coin: symbol,
      method: method || "",
      status: "pending",
      // Balance is row mutate nahi hua — sirf reserve hua.
      balanceChanged: false,
      createdAt: new Date()
    });

    res.json({
      success: true,
      id: ref.id,
      status: "pending",
      availableAfter: Math.max(0, available - requested),
      message: "Withdrawal request submitted. Balance will be deducted only after admin approval.",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/user/:userId", requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.uid) return res.status(403).json({ error: "Not allowed" });
    const [depositsSnap, withdrawalsSnap, swapsSnap, tradesSnap] = await Promise.all([
      db.collection("deposits").where("userId", "==", userId).get(),
      db.collection("withdrawals").where("userId", "==", userId).get(),
      db.collection("swaps").where("userId", "==", userId).get(),
      db.collection("tradeHistory").where("userId", "==", userId).get(),
    ]);

    const deposits = depositsSnap.docs.map(d => ({ id: d.id, type: "deposit", ...d.data() }));
    const withdrawals = withdrawalsSnap.docs.map(d => ({ id: d.id, type: "withdrawal", ...d.data() }));
    const swaps = swapsSnap.docs.map(d => ({ id: d.id, type: "swap", ...d.data() }));
    const trades = tradesSnap.docs.map(d => ({ id: d.id, type: "trade", ...d.data() }));

    const all = [...deposits, ...withdrawals, ...swaps, ...trades];
    all.sort((a, b) => {
      const da = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
      const db2 = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
      return db2 - da;
    });

    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
