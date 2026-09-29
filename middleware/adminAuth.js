import { isAdminToken } from "../config/adminSession.js";

// Pehle yahan ek hard-coded shared secret tha jo /api/employees ki poori
// router guard karta tha. Wo string git history me public thi. Ab guard sirf
// wahi token accept karta jo successful /api/admin/login ne issue kiya ho.
export default function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (isAdminToken(token)) return next();
  return res.status(401).json({ message: "Unauthorized" });
}
