// Shared admin session store.
//
// Pehle `middleware/adminAuth.js` me ek HARD-CODED token tha
// (`admin_secret_token_...`) jo poori /api/employees router ko guard karta
// tha. Wo string repo ke git history me "Initial commit" se padi thi, yaani
// effectively public — clone karke employee create/edit/delete karna
// possible tha. Isliye ab koi bhi static secret nahi hai; token sirf
// successful /api/admin/login par generate hota hai aur memory me rehta hai.
//
// server.js aur middleware dono yahi registry import karte hain, taaki
// login se mila token dono jagah valid ho.

const adminTokens = new Set();

// token -> admin email, taaki approve/reject par audit trail likh sakein.
const adminTokenOwners = new Map();

export function issueAdminToken(token, email) {
  adminTokens.add(token);
  adminTokenOwners.set(token, email);
  return token;
}

export function isAdminToken(token) {
  return typeof token === "string" && adminTokens.has(token);
}

export function adminTokenOwner(token) {
  return adminTokenOwners.get(token) || null;
}

export function revokeAdminToken(token) {
  adminTokens.delete(token);
  adminTokenOwners.delete(token);
}
