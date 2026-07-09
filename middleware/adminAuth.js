export default function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token === "admin_secret_token_kepwix_2025") return next();
  return res.status(403).json({ message: "Unauthorized" });
}