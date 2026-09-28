import { useCallback, useEffect, useRef, useState } from "react";
import { API } from "../config/api";

/**
 * Wallet balances laata hai aur unhe fresh rakhta hai.
 *
 * Ye pehle har page me inline `useEffect` + fetch se hota tha, jismein 3 bugs
 * the:
 *
 *  1. Refetch nahi hota tha (deps sirf user.uid). Admin doosre tab se credit
 *     kare to page purana 0 dikhata rehta tha jab tak hard refresh na ho.
 *  2. `.catch(() => {})` + res.ok check missing tha — 401/500 ya network
 *     failure par `getBalance()` 0 return karta, to page error dikhane ke
 *     bajaye confident "0.000000 BTC" dikhata tha. Galat balance dikhna
 *     financial bug hai, isliye ab error state alag rakhi gayi hai.
 *  3. Server band hone par bhi pages chup-chaap 0 dikhate the.
 *
 * Ab: mount + tab focus + interval par refetch, aur loading/error alag se
 * expose hota hai taaki UI "—" ya error message dikha sake.
 */
export default function useBalances(uid, { intervalMs = 20000 } = {}) {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!uid) {
      setBalances({});
      setLoading(false);
      return;
    }
    // Do calls overlap na hon — warna slow response stale value overwrite kar
    // deta hai (classic race).
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(`${API}/api/users/balance?uid=${encodeURIComponent(uid)}`);
      if (res.status === 401) {
        setError("session");
        setBalances({});
        return;
      }
      if (!res.ok) {
        setError("Server ne balance nahi diya. Page refresh karein.");
        return;
      }
      const data = await res.json();
      if (data && typeof data === "object") {
        setBalances(data);
        setError(null);
      }
    } catch {
      setError("Backend se connect nahi ho paaya");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!uid || !intervalMs) return;
    const id = setInterval(load, intervalMs);
    // Admin doosre tab se credit kare to user ko khud refresh na karna pade.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [uid, intervalMs, load]);

  return { balances, loading, error, refresh: load };
}
