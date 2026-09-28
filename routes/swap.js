import express from "express";
import { db, admin } from "../config/firebase.js";
import requireUser from "../middleware/requireUser.js";
import { balanceKey, isSupported, normalizeSymbol, coinBalance } from "../config/coins.js";
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
    const hashKey = generateHashKey();
    const userRef = db.collection("users").doc(userId);
    const swapRef = db.collection("swaps").doc();

    // Balance check + escrow deduction + record creation — EK transaction me.
    //
    // Pehle ye teen alag steps the: (1) balance padho, (2) balance decrement
    // karo, (3) `collection.add()` se record banao. Beech me crash ya network
    // error ho to paisa DEDUCT ho chuka hota par koi record nahi banta — matlab
    // user ka paisa permanently gaya aur admin ke paas approve/refund karne ke
    // liye kuch hi nahi hota. Transaction se ye ho nahi sakta: teenon ya sab
    // lagenge, ya koi nahi.
    const created = await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) return { code: 404, error: "User not found" };

      // coinBalance() legacy "USDTBalance" ko bhi jodta hai. Pehle yahan seedha
      // `userData[fromKey]` padha jaa raha tha, jisse legacy balance wale user
      // ko "Insufficient balance" milta tha jabki uske paas paisa hota tha.
      const fromBal = coinBalance(userDoc.data() || {}, from);

      if (amt > fromBal) {
        return { code: 400, error: `Insufficient ${from} balance`, available: fromBal };
      }

      tx.update(userRef, { [fromKey]: FieldValue.increment(-amt) });
      tx.create(swapRef, {
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
        updatedAt: new Date(),
      });

      return { id: swapRef.id };
    });

    if (created.error) {
      return res.status(created.code).json({ error: created.error, available: created.available });
    }

    return res.json({
      success: true,
      id: created.id,
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
