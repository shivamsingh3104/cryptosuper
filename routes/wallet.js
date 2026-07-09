import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// ADD WALLET
router.post("/add", async (req, res) => {
  try {
    const { walletName, walletAddress, hashKey, uploadedBy } = req.body;

    const doc = await db.collection("wallets").add({
      walletName,
      walletAddress,
      hashKey,
      uploadedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("wallets").get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { walletName, walletAddress, hashKey } = req.body;

    await db.collection("wallets").doc(id).update({
      walletName,
      walletAddress,
      hashKey,
      updatedAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    await db.collection("wallets").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;