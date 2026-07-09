import express from "express";
import { db, admin } from "../config/firebase.js";
const FieldValue = admin.firestore.FieldValue;

const router = express.Router();

function coinBalanceKey(pair, side) {
  const coin = pair.split("/")[0];
  if (side === "Buy") return coin + "Balance";
  return "balance";
}

router.post("/order", async (req, res) => {
  try {
    const { userId, pair, side, type, amount, price } = req.body;

    if (!userId || !pair || !side || !amount || !price) {
      return res.json({ error: "Missing order details" });
    }

    if (!["Buy", "Sell"].includes(side)) {
      return res.json({ error: "Side must be Buy or Sell" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};
    const usdtBalance = userData.balance || 0;
    const totalCost = Number(amount) * Number(price);
    const coin = pair.split("/")[0];
    const coinBal = userData[coin + "Balance"] || 0;

    if (side === "Buy" && totalCost > usdtBalance) {
      return res.json({ error: `Insufficient USDT balance. Need $${totalCost.toFixed(2)}, have $${usdtBalance.toFixed(2)}` });
    }

    if (side === "Sell" && Number(amount) > coinBal) {
      return res.json({ error: `Insufficient ${coin} balance. Need ${amount}, have ${coinBal.toFixed(6)}` });
    }

    if (side === "Buy") {
      await db.collection("users").doc(userId).set({
        balance: FieldValue.increment(-totalCost),
        [coin + "Balance"]: FieldValue.increment(Number(amount))
      }, { merge: true });
    } else {
      await db.collection("users").doc(userId).set({
        balance: FieldValue.increment(totalCost),
        [coin + "Balance"]: FieldValue.increment(-Number(amount))
      }, { merge: true });
    }

    await db.collection("tradeHistory").add({
      userId,
      pair,
      side,
      type: type || "Limit",
      amount: Number(amount),
      price: Number(price),
      total: totalCost,
      status: "filled",
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: `${side} ${amount} ${pair} @ ${price} — Done`,
      newBalances: {
        usdt: side === "Buy" ? usdtBalance - totalCost : usdtBalance + totalCost,
        [coin]: side === "Buy" ? coinBal + Number(amount) : coinBal - Number(amount)
      }
    });

  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection("tradeHistory")
      .where("userId", "==", userId)
      .get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
