import { db } from "../config/firebase.js";

// GET COMPANY
export const getCompany = async (req, res) => {
  try {
    const doc = await db.collection("company").doc("profile").get();

    if (!doc.exists) {
      return res.json({});
    }

    return res.json(doc.data());
  } catch (err) {
    console.log("GET ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE COMPANY
export const updateCompany = async (req, res) => {
  try {
    const data = req.body;

    await db.collection("company").doc("profile").set(data, { merge: true });

    const updatedDoc = await db.collection("company").doc("profile").get();

    return res.json({
      success: true,
      data: updatedDoc.exists ? updatedDoc.data() : {}
    });
  } catch (err) {
    console.log("PUT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};