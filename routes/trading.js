import express from "express";
import { db, admin } from "../config/firebase.js";
import requireUser from "../middleware/requireUser.js";
import { balanceKey, isSupported, normalizeSymbol } from "../config/coins.js";
import { getUsdPrice } from "../config/pricing.js";

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;

// ── PLACE ORDER ──────────────────────────────────────────────
// Client amount + side + pair bhejta hai. PRICE backend live
// feed se leta hai — client ka price kabhi use nahi hota.
// Funds turant "escrow" ho jaate hain (deduct), lekin doosri
// side ka credit admin approval pe hi hota hai.
router.post("/order", requireUser, async (req, res) => {
  try {
    const { pair, side, type, amount } = req.body;
    const userId = req.uid;
    const userEmail = req.email || "";

    if (!pair || !side || !amount) {
      return res.status(400).json({ error: "Missing order details" });
    }
    if (!["Buy", "Sell"].includes(side)) {
      return res.status(400).json({ error: "Side must be Buy or Sell" });
    }

    const [baseRaw, quoteRaw] = String(pair).split("/");
    const base = normalizeSymbol(baseRaw);
    const quote = normalizeSymbol(quoteRaw || "USDT");

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!isSupported(base) || !isSupported(quote)) {
      return res.status(400).json({ error: "Unsupported trading pair" });
    }
    if (base === quote) {
      return res.status(400).json({ error: "Base and quote coin must differ" });
    }

    // server-side price — client ka price field ignore
    let basePrice, quotePrice;
    try {
      basePrice = await getUsdPrice(base);
      quotePrice = await getUsdPrice(quote);
    } catch {
      return res.status(503).json({ error: "Price feed unavailable. Try again shortly." });
    }

    const price = Number((basePrice / quotePrice).toFixed(8));
    const totalCost = Number((amt * price).toFixed(8));
    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      return res.status(400).json({ error: "Invalid order value" });
    }

    const quoteKey = balanceKey(quote);
    const baseKey = balanceKey(base);

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data() || {};

    if (side === "Buy") {
      const quoteBal = userData[quoteKey] ?? (userData.balance || 0);
      if (totalCost > quoteBal) {
        return res.status(400).json({
          error: `Insufficient ${quote} balance. Need ${totalCost}, have ${quoteBal}`
        });
      }
      await db.collection("users").doc(userId).set({
        [quoteKey]: FieldValue.increment(-totalCost)
      }, { merge: true });
    } else {
      const baseBal = userData[baseKey] ?? 0;
      if (amt > baseBal) {
        return res.status(400).json({
          error: `Insufficient ${base} balance. Need ${amt}, have ${baseBal}`
        });
      }
      await db.collection("users").doc(userId).set({
        [baseKey]: FieldValue.increment(-amt)
      }, { merge: true });
    }

    const doc = await db.collection("tradeHistory").add({
      userId,
      userEmail,
      pair: `${base}/${quote}`,
      base,
      quote,
      side,
      type: type || "Limit",
      amount: amt,
      price,
      total: totalCost,
      basePriceUsd: basePrice,
      quotePriceUsd: quotePrice,
      status: "pending",
      createdAt: new Date()
    });

    return res.json({
      success: true,
      id: doc.id,
      status: "pending",
      message: `${side} order placed: ${amt} ${base} @ ${price} ${quote}. Fill after admin approval.`
    });
  } catch (err) {
    console.error("Order error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── TRADE HISTORY ────────────────────────────────────────────
router.get("/history/:userId", requireUser, async (req, res) => {
  try {
    if (req.params.userId !== req.uid) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const snapshot = await db.collection("tradeHistory")
      .where("userId", "==", req.uid)
      .get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(items);
  } catch (err) {
    console.error("Trade history error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
