import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const users = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        uid: data.uid || doc.id,   // fallback
        email: data.email || "No Email"
      };
    });

    res.json(users);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;