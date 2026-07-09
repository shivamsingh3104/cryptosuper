import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("marketFees").get();
    const fees = {};
    snapshot.docs.forEach(doc => {
      fees[doc.id] = doc.data().percentage || 0;
    });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/set", async (req, res) => {
  try {
    const { currencyId, percentage } = req.body;
    if (!currencyId || percentage === undefined) {
      return res.json({ error: "currencyId and percentage required" });
    }
    await db.collection("marketFees").doc(currencyId).set({
      percentage: Number(percentage),
      updatedAt: new Date()
    });
    res.json({ success: true, currencyId, percentage: Number(percentage) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
