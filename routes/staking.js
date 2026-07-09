import express from "express";
import { db, admin } from "../config/firebase.js";
const FieldValue = admin.firestore.FieldValue;

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { userId, userEmail, coinId, symbol, name, image, amount, period, rate } = req.body;

    if (!userId || !coinId || !amount || !period) {
      return res.json({ error: "Missing staking details" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};
    const fieldName = symbol === "USDT" || symbol === "USDC" ? "balance" : coinId === "bitcoin" ? "BTCBalance" : symbol + "Balance";
    const coinBalance = userData[fieldName] || 0;

    if (Number(amount) > coinBalance) {
      return res.json({ error: `Insufficient ${symbol} balance` });
    }

    await db.collection("users").doc(userId).set({
      [fieldName]: FieldValue.increment(-Number(amount))
    }, { merge: true });

    const endDate = new Date(Date.now() + Number(period) * 86400000);

    const doc = await db.collection("stakingPlans").add({
      userId,
      userEmail: userEmail || "",
      coinId,
      symbol,
      name,
      image: image || "",
      amount: Number(amount),
      period: Number(period),
      rate: Number(rate),
      profit: 0,
      status: "active",
      startDate: new Date(),
      endDate,
      createdAt: new Date()
    });

    res.json({
      success: true,
      id: doc.id,
      message: `${amount} ${symbol} staked for ${period} days at ${rate}% APR`
    });

  } catch (err) {
    console.error("Staking error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection("stakingPlans")
      .where("userId", "==", userId)
      .get();

    const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const now = Date.now();
    plans.forEach(p => {
      const elapsed = Math.min(1, (now - new Date(p.startDate).getTime()) / (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()));
      p.realtimeProfit = Number((p.amount * p.rate / 100 * elapsed).toFixed(8));
      p.status = now >= new Date(p.endDate).getTime() ? "completed" : p.status;
    });

    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("stakingPlans").doc(id).get();
    if (!doc.exists) return res.json({ error: "Plan not found" });

    const plan = doc.data();
    if (plan.status !== "active") return res.json({ error: "Already cancelled/completed" });

    const cancelCoinKey = plan.symbol === "USDT" || plan.symbol === "USDC" ? "balance" : plan.coinId === "bitcoin" ? "BTCBalance" : plan.symbol + "Balance";

    await db.collection("users").doc(plan.userId).set({
      [cancelCoinKey]: FieldValue.increment(Number(plan.amount))
    }, { merge: true });

    await db.collection("stakingPlans").doc(id).update({
      status: "cancelled",
      cancelledAt: new Date()
    });

    res.json({ success: true, message: `${plan.amount} ${plan.symbol} returned to wallet` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STAKING RATES ──────────────────────────────────────────────
router.get("/rates", async (req, res) => {
  try {
    const snapshot = await db.collection("stakingRates").get();
    if (snapshot.empty) {
      return res.json([
        { coinId:"bitcoin",  symbol:"BTC",  name:"Bitcoin",   rate:17.39 },
        { coinId:"tether",   symbol:"USDT", name:"Tether",    rate:17.39 },
        { coinId:"ethereum", symbol:"ETH",  name:"Ethereum",  rate:17.39 },
        { coinId:"usd-coin", symbol:"USDC", name:"USD Coin",  rate:17.39 },
        { coinId:"solana",   symbol:"SOL",  name:"Solana",    rate:17.39 },
        { coinId:"tron",     symbol:"TRX",  name:"TRON",      rate:17.39 },
        { coinId:"ripple",   symbol:"XRP",  name:"Ripple",    rate:17.39 },
        { coinId:"litecoin", symbol:"LTC",  name:"Litecoin",  rate:17.39 },
        { coinId:"toncoin",  symbol:"TON",  name:"Toncoin",   rate:17.39 },
        { coinId:"dogecoin", symbol:"DOGE", name:"Dogecoin",  rate:17.39 },
      ]);
    }
    const rates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/rates/set", async (req, res) => {
  try {
    const { coinId, symbol, name, rate } = req.body;
    if (!coinId || rate === undefined) return res.json({ error: "coinId and rate required" });
    await db.collection("stakingRates").doc(coinId).set({
      coinId, symbol, name: name || "", rate: Number(rate), updatedAt: new Date()
    }, { merge: true });
    res.json({ success: true, message: `${symbol || coinId} staking rate set to ${rate}%` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: ALL STAKING PLANS ───────────────────────────────────
router.get("/admin/all", async (req, res) => {
  try {
    const snapshot = await db.collection("stakingPlans").get();
    const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/claim/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("stakingPlans").doc(id).get();
    if (!doc.exists) return res.json({ error: "Plan not found" });

    const plan = doc.data();
    if (plan.status !== "active") return res.json({ error: "Already claimed" });

    const now = Date.now();
    if (now < new Date(plan.endDate).getTime()) {
      return res.json({ error: "Staking period not over yet" });
    }

    const elapsed = 1;
    const profit = Number((plan.amount * plan.rate / 100 * elapsed).toFixed(8));
    const totalReturn = Number(plan.amount) + profit;

    const claimCoinKey = plan.symbol === "USDT" || plan.symbol === "USDC" ? "balance" : plan.coinId === "bitcoin" ? "BTCBalance" : plan.symbol + "Balance";

    await db.collection("users").doc(plan.userId).set({
      [claimCoinKey]: FieldValue.increment(totalReturn)
    }, { merge: true });

    await db.collection("stakingPlans").doc(id).update({
      status: "claimed",
      profit,
      claimedAt: new Date()
    });

    res.json({ success: true, message: `Claimed ${totalReturn} ${plan.symbol} (${profit} profit)` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
