import express from "express";
import { db, admin } from "../config/firebase.js";
const FieldValue = admin.firestore.FieldValue;

const router = express.Router();

router.post("/submit", async (req, res) => {
  try {
    const { transactionHash, amount, userId, userEmail } = req.body;

    if (!amount || !userId) {
      return res.json({ error: "Amount and userId required" });
    }

    await db.collection("users").doc(userId).set({
      balance: FieldValue.increment(Number(amount))
    }, { merge: true });

    await db.collection("deposits").add({
      userId,
      userEmail: userEmail || "",
      amount: Number(amount),
      transactionHash: transactionHash || "",
      status: "approved",
      createdAt: new Date()
    });

    res.json({ success: true, message: "Deposit successful! Balance updated." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/deposit", async (req, res) => {
  try {
    const { userId, userEmail, amount, usdAmount, currency, coin, method, type, walletAddress, txHash } = req.body;
    console.log("DEPOSIT RECEIVED:", { userId, amount, usdAmount, coin, coinKey: coin && coin !== "USDT" ? coin + "Balance" : "balance" });

    if (!amount || !userId) {
      return res.json({ error: "Amount and userId required" });
    }

    const coinKey = coin && coin !== "USDT" ? coin + "Balance" : "balance";
    console.log("DEPOSIT - coinKey:", coinKey, "amount:", amount);

    await db.collection("users").doc(userId).set({
      [coinKey]: FieldValue.increment(Number(amount))
    }, { merge: true });

    // Verify immediately
    const verifyDoc = await db.collection("users").doc(userId).get();
    console.log("DEPOSIT - After save, user data:", verifyDoc.data());

    await db.collection("deposits").add({
      userId,
      userEmail: userEmail || "",
      amount: Number(amount),
      usdAmount: usdAmount ? Number(usdAmount) : Number(amount),
      currency: currency || "USD",
      coin: coin || "",
      method: method || "",
      type: type || "fiat",
      walletAddress: walletAddress || "",
      txHash: txHash || "",
      status: "approved",
      createdAt: new Date()
    });

    res.json({ success: true, message: "Deposit successful! Balance updated." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const { userId, amount, walletAddress, userEmail, coin, method } = req.body;

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

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
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
