import express from "express";
import { db, admin } from "../config/firebase.js";
import requireUser from "../middleware/requireUser.js";
import { balanceKey, isSupported, normalizeSymbol } from "../config/coins.js";
import { getUsdPrice } from "../config/pricing.js";
import crypto from "crypto";

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;

function generateHashKey() {
  return "KEP-" + crypto.randomBytes(12).toString("hex").toUpperCase();
}

// ── CREATE SWAP REQUEST ──────────────────────────────────────
// Client sirf fromCurrency/toCurrency/fromAmount bhejta hai.
// toAmount BACKEND calculate karta hai live price se.
// Sirf fromAmount escrow ( deduct) hota hai — toAmount admin
// approve hone pe hi credit hota hai.
router.post("/create", requireUser, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, walletId } = req.body;
    const userId = req.uid;
    const userEmail = req.email || "";

    const from = normalizeSymbol(fromCurrency);
    const to = normalizeSymbol(toCurrency);
    const amt = Number(fromAmount);

    if (!from || !to || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Missing or invalid swap details" });
    }
    if (from === to) {
      return res.status(400).json({ error: "Cannot swap a coin for itself" });
    }
    if (!isSupported(from) || !isSupported(to)) {
      return res.status(400).json({ error: "Unsupported coin" });
    }

    // server-side price — client ka toAmount ignore
    let fromPrice, toPrice, toAmount;
    try {
      fromPrice = await getUsdPrice(from);
      toPrice = await getUsdPrice(to);
    } catch {
      return res.status(503).json({ error: "Price feed unavailable. Try again shortly." });
    }

    toAmount = Number(((amt * fromPrice) / toPrice).toFixed(8));
    if (!Number.isFinite(toAmount) || toAmount <= 0) {
      return res.status(400).json({ error: "Invalid swap amount" });
    }

    const fromKey = balanceKey(from);

    // balance check + escrow deduction
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const userData = userDoc.data() || {};
    const fromBal = userData[fromKey] ?? (from === "USDT" ? userData.balance || 0 : 0);

    if (amt > fromBal) {
      return res.status(400).json({ error: `Insufficient ${from} balance` });
    }

    await db.collection("users").doc(userId).set({
      [fromKey]: FieldValue.increment(-amt)
    }, { merge: true });

    const hashKey = generateHashKey();

    const doc = await db.collection("swaps").add({
      userId,
      userEmail,
      fromCurrency: from,
      toCurrency: to,
      fromAmount: amt,
      toAmount,
      fromPriceUsd: fromPrice,
      toPriceUsd: toPrice,
      amountToPay: Number((amt * fromPrice).toFixed(2)),
      walletId: walletId || "",
      hashKey,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.json({
      success: true,
      id: doc.id,
      message: `Swap request submitted: ${amt} ${from} → ${toAmount} ${to}. Credited after admin approval.`,
      hashKey,
      fromAmount: amt,
      toAmount,
      status: "pending"
    });
  } catch (err) {
    console.error("Swap create error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── SWAP HISTORY ─────────────────────────────────────────────
router.get("/user/:userId", requireUser, async (req, res) => {
  try {
    if (req.params.userId !== req.uid) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const snapshot = await db.collection("swaps")
      .where("userId", "==", req.uid)
      .get();

    const swaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    swaps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(swaps);
  } catch (err) {
    console.error("Swap history error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
