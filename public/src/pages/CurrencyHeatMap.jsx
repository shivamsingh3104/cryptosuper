import { useState, useEffect, useCallback, useRef } from "react";

const CURRENCIES = ["EUR","USD","JPY","GBP","CHF","AUD","CAD","NZD","SEK","NOK","DKK","HKD"];
const FLAGS = { EUR:"🇪🇺",USD:"🇺🇸",JPY:"🇯🇵",GBP:"🇬🇧",CHF:"🇨🇭",AUD:"🇦🇺",CAD:"🇨🇦",NZD:"🇳🇿",SEK:"🇸🇪",NOK:"🇳🇴",DKK:"🇩🇰",HKD:"🇭🇰" };

function getColor(pct) {
  if (pct === null) return { bg:"#fff", text:"#111" };
  const abs = Math.min(Math.abs(pct), 0.5);
  const intensity = abs / 0.5;
  if (pct > 0.04)  return { bg:`rgba(38,166,154,${0.12+intensity*0.7})`, text: intensity>0.6?"#fff":"#111" };
  if (pct < -0.04) return { bg:`rgba(239,83,80,${0.12+intensity*0.7})`,  text: intensity>0.6?"#fff":"#111" };
  return { bg:"rgba(150,150,150,0.15)", text:"#555" };
}

export default function CurrencyHeatMap() {
  const [changes, setChanges] = useState({});
  const [rates,   setRates]   = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpd, setLastUpd] = useState(null);
  const [error,   setError]   = useState("");
  const prevRates = useRef(null);

  const computeChanges = useCallback((cur, prev) => {
    const map = {};
    CURRENCIES.forEach(from => {
      map[from] = {};
      CURRENCIES.forEach(to => {
        if (from === to) { map[from][to] = null; return; }
        const fromNow  = cur[from]  || 1, toNow  = cur[to]  || 1;
        const fromPrev = prev[from] || 1, toPrev = prev[to] || 1;
        const crossNow  = toNow  / fromNow;
        const crossPrev = toPrev / fromPrev;
        const pct = ((crossNow - crossPrev) / crossPrev) * 100;
        map[from][to] = parseFloat(pct.toFixed(2));
      });
    });
    return map;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res  = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.rates) {
        const cur = data.rates;
        const prev = prevRates.current;
        prevRates.current = cur;
        setRates(cur);
        setChanges(prev ? computeChanges(cur, prev) : {});
        setLastUpd(new Date());
      } else setError("Could not load real exchange rates.");
    } catch {
      setError("Could not load real exchange rates.");
      setRates({});
      setChanges({});
    } finally { setLoading(false); }
  }, [computeChanges]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60000);
    return () => clearInterval(t);
  }, [fetchData]);

  return (
    <div className="tool-page cr-page">
      <div className="cr-header">
        <h2 className="cr-title">Currency Heatmap</h2>
        <div className="cr-meta">
          {lastUpd && <span className="tl-live">🟢 Updated · {lastUpd.toLocaleTimeString()}</span>}
          <button className="tool-refresh-btn" onClick={fetchData}>↻</button>
        </div>
      </div>

      {error && <div className="tool-error" style={{ color: "#ef5350", fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {loading && <div className="tool-loading"><div className="spinner"/><p>Loading…</p></div>}

      {!loading && (
        <>
          <div className="hm-table-wrap">
            <table className="hm-table">
              <thead>
                <tr>
                  <th className="hm-th-corner"/>
                  {CURRENCIES.map(c=>(
                    <th key={c} className="hm-th"><span>{FLAGS[c]}</span> {c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRENCIES.map(from=>(
                  <tr key={from}>
                    <td className="hm-th-row"><span>{FLAGS[from]}</span> {from}</td>
                    {CURRENCIES.map(to=>{
                      const pct = changes[from]?.[to]??null;
                      const {bg,text} = getColor(pct);
                      return (
                        <td key={to} className="hm-cell" style={{background:bg,color:text}}>
                          {pct===null?"": `${pct>=0?"+":""}${pct}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hm-legend">
            {[["hm-dot-strong-green","Strong Gain"],["hm-dot-green","Gain"],["hm-dot-neutral","Neutral"],["hm-dot-red","Loss"],["hm-dot-strong-red","Strong Loss"]].map(([cls,lbl])=>(
              <div key={lbl} className="hm-legend-item"><div className={`hm-dot ${cls}`}/><span>{lbl}</span></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
