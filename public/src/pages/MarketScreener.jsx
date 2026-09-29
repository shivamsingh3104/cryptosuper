import { useState, useEffect, useCallback, useRef } from "react";
import { API } from "../config/api";

const EXCHANGES = ["BINANCE","BYBIT","OKX","KUCOIN","KRAKEN","COINBASE","BITFINEX","HUOBI","GATE"];

function getRating(chg) {
  if (chg >  3) return { label:"Strong Buy",  color:"#26a69a", dir:"↑" };
  if (chg >  0.5) return { label:"Buy",        color:"#26a69a", dir:"↑" };
  if (chg < -3) return { label:"Strong Sell", color:"#ef5350", dir:"↓" };
  if (chg < -0.5) return { label:"Sell",       color:"#ef5350", dir:"↓" };
  return { label:"Neutral", color:"#888", dir:"→" };
}

function fmtBig(n) {
  if (!n) return "—";
  if (n >= 1e12) return (n/1e12).toFixed(2)+"T";
  if (n >= 1e9)  return (n/1e9).toFixed(2)+"B";
  if (n >= 1e6)  return (n/1e6).toFixed(2)+"M";
  return n.toFixed(0);
}

export default function MarketScreener() {
  const [rows, setRows]     = useState([]);
  const [base, setBase]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sortCol, setSortCol] = useState("volUsd");
  const [sortDir, setSortDir] = useState("desc");
  const [page,    setPage]    = useState(1);
  const [lastUpd, setLastUpd] = useState(null);
  const tickRef = useRef(null);
  const PER = 15;

  const buildRows = useCallback((data) => {
    const result = [];
    data.forEach(c => {
      const exCount = Math.floor(Math.random()*3)+1;
      for (let i=0;i<exCount;i++) {
        const ex   = EXCHANGES[Math.floor(Math.random()*EXCHANGES.length)];
        const var1 = 1+(Math.random()-0.5)*0.002;
        const chg  = (c.price_change_percentage_24h??0)+(Math.random()-0.5)*0.4;
        const price= c.current_price*var1;
        const vol  = c.total_volume*(0.05+Math.random()*0.35);
        result.push({
          id:    `${c.id}-${ex}-${i}`,
          ticker:`${c.symbol.toUpperCase()}USDT`,
          image: c.image, name: c.name,
          price, chgPct:chg, chg:price*chg/100,
          high: c.high_24h??price*1.02,
          low:  c.low_24h??price*0.98,
          vol, volUsd: vol*price,
          volChg: 60+Math.random()*120,
          exchange: ex,
        });
      }
    });
    return result;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/prices?limit=25`);
      const data = (await res.json()).coins || [];
      const built = buildRows(data);
      setBase(built); setRows(built); setLastUpd(new Date());
    } catch {}
    finally { setLoading(false); }
  }, [buildRows]);

  // Tick: update prices every 2s
  const startTick = useCallback(() => {
    tickRef.current = setInterval(() => {
      setRows(prev => prev.map(r => {
        const newPrice = r.price*(1+(Math.random()-0.5)*0.0006);
        const newChg   = r.chgPct+(Math.random()-0.5)*0.05;
        return { ...r, price:newPrice, chgPct:newChg, chg:newPrice*newChg/100 };
      }));
      setLastUpd(new Date());
    }, 2000);
  }, []);

  useEffect(() => {
    fetchData().then(startTick);
    const refetchId = setInterval(fetchData, 60000);
    return () => { clearInterval(tickRef.current); clearInterval(refetchId); };
  }, [fetchData, startTick]);

  const filtered = rows.filter(r =>
    !search.trim() || r.ticker.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => {
    const av=a[sortCol]??0, bv=b[sortCol]??0;
    return sortDir==="asc"?av-bv:bv-av;
  });

  const pages = Math.ceil(filtered.length/PER);
  const paged = filtered.slice((page-1)*PER, page*PER);
  const handleSort = k => { if(sortCol===k) setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortCol(k);setSortDir("desc");} };

  return (
    <div className="tool-page">
      <div className="tool-toolbar">
        <div className="tool-toolbar-left">
          <span className="tool-match-count">{filtered.length} MATCHES</span>
          {lastUpd && <span className="tl-live">🟢 Live · {lastUpd.toLocaleTimeString()}</span>}
        </div>
        <div className="tool-toolbar-right">
          <div className="tool-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="tool-search" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
          <button className="tool-refresh-btn" onClick={fetchData}>↻</button>
        </div>
      </div>

      {loading && <div className="tool-loading"><div className="spinner"/><p>Loading…</p></div>}
      {!loading && (
        <>
          <div className="tool-table-wrap">
            <table className="tool-table">
              <thead>
                <tr>
                  <th className="tc-name ms-th-ticker" onClick={()=>handleSort("ticker")}>TICKER</th>
                  <th className="tc-num" onClick={()=>handleSort("price")}>PRICE</th>
                  <th className="tc-num" onClick={()=>handleSort("chgPct")}>CHG %</th>
                  <th className="tc-num" onClick={()=>handleSort("chg")}>CHG</th>
                  <th className="tc-num" onClick={()=>handleSort("high")}>24H HIGH</th>
                  <th className="tc-num" onClick={()=>handleSort("low")}>24H LOW</th>
                  <th className="tc-num" onClick={()=>handleSort("vol")}>VOLUME</th>
                  <th className="tc-num ms-th-sorted" onClick={()=>handleSort("volUsd")}>VOL USD</th>
                  <th className="tc-num">RATING</th>
                  <th className="tc-num">EXCHANGE</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(c => {
                  const rating = getRating(c.chgPct);
                  return (
                    <tr key={c.id} className="tc-row">
                      <td className="tc-name-cell ms-ticker-cell">
                        <img src={c.image} width={22} height={22} alt={c.name} style={{borderRadius:"50%"}}/>
                        <span className="ms-ticker-text">{c.ticker}</span>
                      </td>
                      <td className="tc-num-cell ms-price-cell">{c.price.toFixed(c.price>100?2:4)}</td>
                      <td className={`tc-num-cell ${c.chgPct>=0?"tc-green":"tc-red"}`}>{c.chgPct>=0?"+":""}{c.chgPct.toFixed(2)}%</td>
                      <td className={`tc-num-cell ${c.chg>=0?"tc-green":"tc-red"}`}>{c.chg>=0?"+":""}{c.chg.toFixed(c.price>100?2:4)}</td>
                      <td className="tc-num-cell">{c.high?.toFixed(c.high>100?2:4)}</td>
                      <td className="tc-num-cell">{c.low?.toFixed(c.low>100?2:4)}</td>
                      <td className="tc-num-cell">{fmtBig(c.vol)}</td>
                      <td className="tc-num-cell ms-volUsd-cell">{fmtBig(c.volUsd)}</td>
                      <td className="tc-num-cell">
                        <span style={{color:rating.color,fontWeight:600,fontSize:12}}>{rating.dir} {rating.label}</span>
                      </td>
                      <td className="tc-num-cell ms-exchange-cell">{c.exchange}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages>1&&(
            <div className="tool-pagination">
              <button className="tp-arrow" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
              {Array.from({length:pages},(_,i)=>(
                <button key={i+1} className={`tp-btn${page===i+1?" active":""}`} onClick={()=>setPage(i+1)}>{i+1}</button>
              ))}
              <button className="tp-arrow" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
