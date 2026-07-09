import express from "express";
import { db, admin } from "../config/firebase.js";
import crypto from "crypto";

const router = express.Router();

function generateHashKey() {
  return "KEP-" + crypto.randomBytes(12).toString("hex").toUpperCase();
}

router.post("/create", async (req, res) => {
  try {
    const { userId, userEmail, fromCurrency, toCurrency, fromAmount, toAmount, amountToPay, walletId } = req.body;

    if (!userId || !fromCurrency || !toCurrency || !fromAmount || !toAmount) {
      return res.json({ error: "Missing swap details" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.json({ error: "User not found" });

    const userData = userDoc.data();
    const fromKey = fromCurrency === "USDT" ? "balance" : fromCurrency + "Balance";
    const toKey = toCurrency === "USDT" ? "balance" : toCurrency + "Balance";
    const currentFromBalance = userData[fromKey];
    const fromBal = currentFromBalance !== undefined ? currentFromBalance : userData.balance || 0;

    if (Number(fromAmount) > fromBal) {
      return res.json({ error: `Insufficient ${fromCurrency} balance` });
    }

    const hashKey = generateHashKey();

    await db.collection("users").doc(userId).set({
      [fromKey]: admin.firestore.FieldValue.increment(-Number(fromAmount))
    }, { merge: true });

    await db.collection("users").doc(userId).set({
      [toKey]: admin.firestore.FieldValue.increment(Number(toAmount))
    }, { merge: true });

    await db.collection("swaps").add({
      userId,
      userEmail: userEmail || "",
      fromCurrency,
      toCurrency,
      fromAmount: Number(fromAmount),
      toAmount: Number(toAmount),
      amountToPay: Number(amountToPay || 0),
      walletId: walletId || "",
      hashKey,
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Swapped ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`,
      hashKey
    });

  } catch (err) {
    console.error("Swap create error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/claim", async (req, res) => {
  try {
    const { hashKey, userId } = req.body;

    if (!hashKey) {
      return res.json({ error: "Hash key required" });
    }

    const snapshot = await db.collection("swaps")
      .where("hashKey", "==", hashKey)
      .get();

    if (snapshot.empty) {
      return res.json({ error: "Invalid hash key" });
    }

    const doc = snapshot.docs[0];
    const swap = { id: doc.id, ...doc.data() };

    if (swap.userId !== userId) {
      return res.json({ error: "This hash key does not belong to you" });
    }

    if (swap.status === "completed") {
      return res.json({ error: "Swap already claimed" });
    }

    if (swap.status !== "processed") {
      return res.json({ error: "Admin has not processed this swap yet. Please wait." });
    }

    const claimKey = swap.toCurrency === "USDT" ? "balance" : swap.toCurrency + "Balance";

    await db.collection("users").doc(userId).set({
      [claimKey]: admin.firestore.FieldValue.increment(Number(swap.toAmount))
    }, { merge: true });

    await db.collection("swaps").doc(doc.id).update({
      status: "completed",
      claimedAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, message: `Credited ${swap.toAmount} ${swap.toCurrency} to your wallet` });

  } catch (err) {
    console.error("Swap claim error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection("swaps")
      .where("userId", "==", userId)
      .get();

    const swaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    swaps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(swaps);
  } catch (err) {
    console.error("Swap history error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
