import { db } from "./firebase.js";
import { normalizeSymbol, coinBalance } from "./coins.js";

// Pending deposit/withdrawal "holds".
//
// Rule: user ka balance tabhi change hota hai jab admin approve karta hai.
// Lekin pending withdrawal ka amount user ke paas se RESERVE ho chuka hota hai,
// warna same balance par N pending requests bana sakte the aur approve karte
// waqt "Insufficient balance now" fail hota.
//
//   available(coin) = balance(coin) - sum(pending withdrawals for that coin)
//
// Isse wallet me dikhne wala number = jo user sach me naya withdraw kar sakta hai.

// Pending withdrawals ka total, per coin. isExcludingId se apne hi doc ko
// chhod sakte hain (approve ke waqt khud ka hold count na ho).
export async function pendingWithdrawalsByCoin(userId, { isExcludingId } = {}) {
  const snap = await db.collection("withdrawals")
    .where("userId", "==", userId)
    .where("status", "==", "pending")
    .get();

  const totals = {};
  snap.docs.forEach(d => {
    if (isExcludingId && d.id === isExcludingId) return;
    const coin = normalizeSymbol(d.data().coin || "USDT");
    totals[coin] = (totals[coin] || 0) + Number(d.data().amount || 0);
  });
  return totals;
}

// Ek coin ke liye available amount.
export async function availableBalance(userData, userId, coin, opts) {
  const total = coinBalance(userData, coin);
  const holds = await pendingWithdrawalsByCoin(userId, opts);
  const held = holds[normalizeSymbol(coin)] || 0;
  return { total, held, available: Math.max(0, total - held) };
}

// Saare coins ke liye holds — /api/users/balance response me bhejne ke liye.
export async function pendingHoldsForUser(userId) {
  const holds = await pendingWithdrawalsByCoin(userId);
  return Object.entries(holds).map(([coin, amount]) => ({
    coin,
    amount,
    field: coin === "USDT" ? "balance" : `${coin}Balance`,
  }));
}
