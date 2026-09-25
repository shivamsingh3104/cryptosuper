const { db } = require("../config/firebase");

// Admin auth = Firebase ID token + Firestore me role === "admin".
// Koi shared secret nahi, isliye browser bundle se leak nahi ho sakta.
module.exports = async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Admin login required" });
  }

  try {
    const decoded = await require("firebase-admin").auth().verifyIdToken(token);

    const snap = await db.collection("users").doc(decoded.uid).get();
    const role = snap.exists ? snap.data().role : null;

    if (role !== "admin") {
      return res.status(403).json({ error: "Not an admin" });
    }

    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};
