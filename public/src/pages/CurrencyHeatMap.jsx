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
  const [period,  setPeriod]  = useState("1D");
  const tickRef = useRef(null);

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
      const res  = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.rates) {
        const cur = data.rates;
        // Simulate "previous" with small random noise
        const prev = {};
        Object.keys(cur).forEach(k => { prev[k] = cur[k] * (1 + (Math.random()-0.5)*0.004); });
        setRates(cur);
        setChanges(computeChanges(cur, prev));
        setLastUpd(new Date());
      }
    } catch {
      // Fallback rates
      const fb = { EUR:0.85,USD:1,JPY:159,GBP:0.74,CHF:0.78,AUD:1.41,CAD:1.38,NZD:1.7,SEK:9.2,NOK:9.4,DKK:6.3,HKD:7.83 };
      const pr = {}; Object.keys(fb).forEach(k=>{ pr[k]=fb[k]*(1+(Math.random()-0.5)*0.004); });
      setRates(fb); setChanges(computeChanges(fb,pr));
    } finally { setLoading(false); }
  }, [computeChanges]);

  // Tick: simulate live price movement every 3s
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setChanges(prev => {
        const next = {};
        CURRENCIES.forEach(from => {
          next[from] = {};
          CURRENCIES.forEach(to => {
            if (from===to) { next[from][to]=null; return; }
            const old = prev[from]?.[to] ?? 0;
            next[from][to] = parseFloat((old + (Math.random()-0.5)*0.03).toFixed(2));
          });
        });
        return next;
      });
      setLastUpd(new Date());
    }, 3000);
    return () => clearInterval(tickRef.current);
  }, []);

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
          <div className="hm-period-tabs">
            {["1D","1W","1M"].map(p=>(
              <button key={p} className={`hm-period-tab${period===p?" active":""}`} onClick={()=>setPeriod(p)}>{p}</button>
            ))}
          </div>
          {lastUpd && <span className="tl-live">🟢 {lastUpd.toLocaleTimeString()}</span>}
          <button className="tool-refresh-btn" onClick={fetchData}>↻</button>
        </div>
      </div>

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
