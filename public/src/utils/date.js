// Firestore Timestamp JSON shape alag alag drivers me alag hoti hai:
// firebase-admin → { _seconds, _nanoseconds }, client SDK → { seconds, nanoseconds },
// plain object → { toDate() }. Ye sab ek jagah handle karta hai.

export function toDate(value) {
  if (!value) return null;

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") return toDate(value.toDate());

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "object") {
    const secs = value._seconds ?? value.seconds;
    if (typeof secs === "number") return new Date(secs * 1000);
  }

  return null;
}

export function fmtDate(value, withTime = true) {
  const d = toDate(value);
  if (!d) return "—";
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
}

// Naya pehle — Firestore docs jinke createdAt objects hain unpe bhi chalta hai.
export function byNewest(a, b) {
  const da = toDate(a?.createdAt)?.getTime() ?? 0;
  const dbb = toDate(b?.createdAt)?.getTime() ?? 0;
  return dbb - da;
}
