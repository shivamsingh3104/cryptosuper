import express from "express";
import { db } from "../config/firebase.js";
import requireUser from "../middleware/requireUser.js";

const router = express.Router();

// ── DEPOSIT SUBMIT ───────────────────────────────────────────
// Deposit sirf "pending" record banata hai. Balance tabhi credit hota hai
// jab admin PUT /api/admin/deposits/:id/approve kare.
router.post("/submit", requireUser, async (req, res) => {
  try {
    const { transactionHash, amount } = req.body;
    const userId = req.uid;
    const userEmail = req.email || "";

    if (!amount || !userId) {
      return res.json({ error: "Amount and userId required" });
    }

    const doc = await db.collection("deposits").add({
      userId,
      userEmail: userEmail || "",
      amount: Number(amount),
      transactionHash: transactionHash || "",
      coin: "USDT",
      status: "pending",
      createdAt: new Date()
    });

    res.json({
      success: true,
      id: doc.id,
      status: "pending",
      message: "Deposit submitted! Balance will be credited after admin approval."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── DEPOSIT ──────────────────────────────────────────────────
// Sirf "pending" record banta hai — koi balance change nahi hota.
// Credit sirf admin approval par (server.js → /api/admin/deposits/:id/approve).
router.post("/deposit", requireUser, async (req, res) => {
  try {
    const { amount, usdAmount, currency, coin, method, type, walletAddress, txHash } = req.body;
    const userId = req.uid;
    const userEmail = req.email || "";

    if (!amount || !userId) {
      return res.json({ error: "Amount and userId required" });
    }

    const doc = await db.collection("deposits").add({
      userId,
      userEmail: userEmail || "",
      amount: Number(amount),
      usdAmount: usdAmount ? Number(usdAmount) : Number(amount),
      currency: currency || "USD",
      coin: coin || "USDT",
      method: method || "",
      type: type || "fiat",
      walletAddress: walletAddress || "",
      txHash: txHash || "",
      status: "pending",
      createdAt: new Date()
    });

    res.json({
      success: true,
      id: doc.id,
      status: "pending",
      message: "Deposit submitted! Balance will be credited after admin approval."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/withdraw", requireUser, async (req, res) => {
  try {
    const { amount, walletAddress, coin, method } = req.body;
    const userId = req.uid;
    const userEmail = req.email || "";

    if (!userId || !amount || !walletAddress) {
      return res.json({ error: "Missing withdraw details" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.json({ error: "User not found" });

    const userData = userDoc.data();
    const coinKey = coin && coin !== "USDT" ? coin + "Balance" : "balance";
    let currentBalance = userData[coinKey];
    if (currentBalance === undefined) currentBalance = userData.balance || 0;

    if (Number(amount) > currentBalance) {
      return res.json({ error: "Insufficient balance" });
    }

    await db.collection("withdrawals").add({
      userId,
      userEmail: userEmail || "",
      amount: Number(amount),
      walletAddress,
      coin: coin || "USDT",
      method: method || "",
      status: "pending",
      createdAt: new Date()
    });

    res.json({ success: true, message: "Withdraw request submitted. Admin will process it." });

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
