export default function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token === "REDACTED") return next();
  return res.status(403).json({ message: "Unauthorized" });
}