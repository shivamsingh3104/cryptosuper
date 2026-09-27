export const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

// NOTE: no admin token / password here.
// Admin access = Firebase ID token (attached by src/authFetch.js)
// + backend checks role === "admin" in Firestore.

export const headers = { "Content-Type": "application/json" };

export const apiFetch = (path, options = {}) =>
  fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
