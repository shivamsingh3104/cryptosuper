import { auth } from "../firebase";
import { API } from "../config/api";

// Backend ke requireUser-protected endpoints tabhi kaam karte hain jab
// Authorization: Bearer <Firebase ID token> bheja jaaye. Ye helper token
// ko hamesha fresh karke inject karta hai. Firebase SDK token ko apne aap
// refresh karta hai, isliye yahan manually refresh ki zaroorat nahi.
export default async function authedFetch(input, options = {}) {
  let token = null;
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch {
      token = null;
    }
  }

  const url = typeof input === "string" && input.startsWith("/") ? `${API}${input}` : input;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(url, { ...options, headers });
}