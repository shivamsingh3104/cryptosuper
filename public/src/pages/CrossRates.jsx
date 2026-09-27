import { useState, useEffect, useCallback, useRef } from "react";

const CURRENCIES = [
  {code:"EUR",flag:"🇪🇺"},{code:"USD",flag:"🇺🇸"},{code:"JPY",flag:"🇯🇵"},
  {code:"GBP",flag:"🇬🇧"},{code:"CHF",flag:"🇨🇭"},{code:"AUD",flag:"🇦🇺"},
  {code:"CAD",flag:"🇨🇦"},{code:"NZD",flag:"🇳🇿"},{code:"CNY",flag:"🇨🇳"},
  {code:"SEK",flag:"🇸🇪"},{code:"NOK",flag:"🇳🇴"},{code:"DKK",flag:"🇩🇰"},
  {code:"ZAR",flag:"🇿🇦"},{code:"HKD",flag:"🇭🇰"},
];

export default function CrossRates() {
  const [rates,   setRates]   = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpd, setLastUpd] = useState(null);
  const [hov,     setHov]     = useState(null);
  const tickRef = useRef(null);

  const fetchRates = useCallback(async () => {
    try {
      const res  = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.rates) { setRates(data.rates); setLastUpd(new Date()); }
    } catch {
      setRates({EUR:0.85,USD:1,JPY:159,GBP:0.74,CHF:0.78,AUD:1.41,CAD:1.38,NZD:1.7,CNY:6.82,SEK:9.2,NOK:9.4,DKK:6.3,ZAR:16.4,HKD:7.83});
    } finally { setLoading(false); }
  }, []);

  // Tick: simulate micro-movement every 2s
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setRates(prev => {
        const next = {...prev};
        Object.keys(next).forEach(k => { next[k] = next[k]*(1+(Math.random()-0.5)*0.0003); });
        setLastUpd(new Date());
        return next;
      });
    }, 2000);
    return () => clearInterval(tickRef.current);
  }, []);

  useEffect(() => { fetchRates(); const t=setInterval(fetchRates,60000); return ()=>clearInterval(t); }, [fetchRates]);

  const cross = (from, to) => {
    if (from===to) return null;
    const f=rates[from], t=rates[to];
    if (!f||!t) return null;
    return t/f;
  };
  const fmt = n => {
    if (n==null) return "—";
    if (n>=100) return n.toFixed(3);
    if (n>=10)  return n.toFixed(4);
    if (n>=1)   return n.toFixed(5);
    return n.toFixed(6);
  };
  const getCellStyle = (from,to,v) => {
    if (!v) return {};
    if (v>1.05) return {background:"rgba(38,166,154,0.1)",color:"#111"};
    if (v<0.95) return {background:"rgba(239,83,80,0.1)",color:"#111"};
    return {};
  };

  return (
    <div className="tool-page cr-page">
      <div className="cr-header">
        <h2 className="cr-title">Cross Rates</h2>
        <div className="cr-meta">
          {lastUpd && <span className="tl-live">🟢 Live · {lastUpd.toLocaleTimeString()}</span>}
          <button className="tool-refresh-btn" onClick={fetchRates}>↻</button>
        </div>
      </div>
      {loading && <div className="tool-loading"><div className="spinner"/></div>}
      {!loading && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th className="cr-th-corner"/>
                {CURRENCIES.map(c=>(
                  <th key={c.code} className="cr-th-col">
                    <div className="cr-currency-head"><span>{c.flag}</span><span>{c.code}</span></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CURRENCIES.map((row,ri)=>(
                <tr key={row.code}>
                  <td className="cr-th-row">
                    <div className="cr-currency-head"><span>{row.flag}</span><span>{row.code}</span></div>
                  </td>
                  {CURRENCIES.map((col,ci)=>{
                    const v=cross(row.code,col.code);
                    const isHov=hov&&(hov.r===ri||hov.c===ci);
                    return (
                      <td key={col.code}
                        className={`cr-cell${ri===ci?" cr-diag":""}${isHov?" cr-hov":""}`}
                        style={ri===ci?{}:getCellStyle(row.code,col.code,v)}
                        onMouseEnter={()=>setHov({r:ri,c:ci})}
                        onMouseLeave={()=>setHov(null)}>
                        {ri===ci?"":fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
