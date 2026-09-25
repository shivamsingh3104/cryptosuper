import { admin } from "../config/firebase.js";

/**
 * Firebase ID token verify karta hai aur req.uid set karta hai.
 * Client ka body me bheja userId kabhi use nahi hota.
 */
export default async function requireUser(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

    if (!token) {
      return res.status(401).json({ error: "Login required" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email || null;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
