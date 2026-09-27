import { auth } from "./firebase";

// Backend ab har user-scoped route pe Firebase ID token verify karta hai.
// Ye wrapper global fetch ko wrap karta hai taaki 74 call sites
// ek-ek karke edit karne ki zaroorat na pade — token apne aap lag jaata hai.
const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:5001").replace(/\/$/, "");

const nativeFetch = window.fetch.bind(window);

function withAuthHeader(headers, token) {
  const h = { ...(headers || {}) };
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    headers.forEach((v, k) => { h[k] = v; });
  } else if (Array.isArray(headers)) {
    headers.forEach(([k, v]) => { h[k] = v; });
  }
  h.Authorization = `Bearer ${token}`;
  return h;
}

window.fetch = async function (input, init = {}) {
  try {
    const url = typeof input === "string" ? input : input?.url;

    // Admin panel: /api/admin/* calls get the token from /api/admin/login
    if (url && url.startsWith(API_ORIGIN) && url.includes("/api/admin/")) {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
        const h = { ...(init.headers || {}), "x-admin-token": adminToken };
        return nativeFetch(input, { ...init, headers: h });
      }
    }

    if (url && url.startsWith(API_ORIGIN)) {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return nativeFetch(input, { ...init, headers: withAuthHeader(init.headers, token) });
      }
    }
  } catch {
    // token na mile to bina token bhej do — backend 401 dega
  }
  return nativeFetch(input, init);
};
