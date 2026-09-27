import { useState, useEffect, useCallback, useRef } from "react";

const CG = "https://api.coingecko.com/api/v3";
const BINANCE = "https://api.binance.com/api/v3";

const COIN_ID_MAP = {
  "BTCUSDT": "bitcoin",
  "ETHUSDT": "ethereum",
  "SOLUSDT": "solana",
  "XRPUSDT": "ripple",
  "ADAUSDT": "cardano",
  "DOGEUSDT": "dogecoin",
  "AVAXUSDT": "avalanche-2",
  "DOTUSDT": "polkadot",
  "TRXUSDT": "tron",
  "MATICUSDT": "matic-network",
  "LTCUSDT": "litecoin",
  "LINKUSDT": "chainlink",
  "XLMUSDT": "stellar",
  "ATOMUSDT": "cosmos",
  "UNIUSDT": "uniswap",
  "TONUSDT": "the-open-network",
  "SHIBUSDT": "shiba-inu",
  "APTUSDT": "aptos",
  "ARBUSDT": "arbitrum",
  "OPUSDT": "optimism",
};

export function useSpotData(symbol = "BTCUSDT") {
  const [price, setPrice]     = useState(null);
  const [stats, setStats]     = useState(null);
  const [asks,  setAsks]      = useState([]);
  const [bids,  setBids]      = useState([]);
  const [trades,setTrades]    = useState([]);
  const [candles,setCandles]  = useState([]);
  const [loading,setLoading]  = useState(true);
  const fetchLock = useRef(false);
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  const coinId = COIN_ID_MAP[symbol] || symbol.replace("USDT", "").toLowerCase();

  const fetchInitial = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    setLoading(true);
    const sym = symbolRef.current;
    try {
      const [cgRes, depthRes, tradesRes, klinesRes, tickerRes] = await Promise.all([
        fetch(`${CG}/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false&price_change_percentage=24h`),
        fetch(`${BINANCE}/depth?symbol=${sym}&limit=15`),
        fetch(`${BINANCE}/trades?symbol=${sym}&limit=20`),
        fetch(`${BINANCE}/klines?symbol=${sym}&interval=15m&limit=100`),
        fetch(`${BINANCE}/ticker/24hr?symbol=${sym}`),
      ]);

      const [cgData] = await cgRes.json();
      const depthData = await depthRes.json();
      const tradesData = await tradesRes.json();
      const klinesData = await klinesRes.json();
      const tickerData = await tickerRes.json();

      const mid = cgData?.current_price || parseFloat(tickerData.lastPrice) || 0;

      setPrice(mid);
      setStats({
        change24h: cgData?.price_change_percentage_24h ?? parseFloat(tickerData.priceChangePercent) ?? 0,
        high24h: cgData?.high_24h ?? parseFloat(tickerData.highPrice),
        low24h: cgData?.low_24h ?? parseFloat(tickerData.lowPrice),
        vol24hBtc: parseFloat((cgData?.total_volume / mid || parseFloat(tickerData.volume) / mid).toFixed(2)),
        vol24hUsd: cgData?.total_volume || parseFloat(tickerData.volume),
        symbol: cgData?.symbol?.toUpperCase() || sym.replace("USDT", ""),
        image: cgData?.image || null,
        name: cgData?.name || sym.replace("USDT", ""),
      });

      setAsks((depthData?.asks || []).slice(0, 15).map(([p, s]) => ({
        price: parseFloat(p), size: parseFloat(s), total: parseFloat(p) * parseFloat(s)
      })));
      setBids((depthData?.bids || []).slice(0, 15).map(([p, s]) => ({
        price: parseFloat(p), size: parseFloat(s), total: parseFloat(p) * parseFloat(s)
      })));

      setTrades((tradesData || []).map(t => ({
        price: parseFloat(t.price),
        size: parseFloat(t.qty),
        isBuy: !t.isBuyerMaker,
        time: new Date(t.time)
      })));

      setCandles((klinesData || []).map(k => ({
        time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]),
        low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5])
      })));

      setLoading(false);
    } catch (err) {
      console.warn("Fetch error:", err.message);
      setTimeout(() => { fetchLock.current = false; fetchInitial(); }, 3000);
    } finally {
      fetchLock.current = false;
    }
  }, [coinId]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  useEffect(() => {
    const id = setInterval(async () => {
      const sym = symbolRef.current;
      try {
        const [depthRes, tradesRes, tickerRes] = await Promise.all([
          fetch(`${BINANCE}/depth?symbol=${sym}&limit=10`),
          fetch(`${BINANCE}/trades?symbol=${sym}&limit=10`),
          fetch(`${BINANCE}/ticker/24hr?symbol=${sym}`),
        ]);
        const depthData = await depthRes.json();
        const tradesData = await tradesRes.json();
        const tickerData = await tickerRes.json();

        const mid = parseFloat(tickerData.lastPrice);
        if (mid) setPrice(mid);

        setAsks((depthData?.asks || []).map(([p, s]) => ({
          price: parseFloat(p), size: parseFloat(s), total: parseFloat(p) * parseFloat(s)
        })));
        setBids((depthData?.bids || []).map(([p, s]) => ({
          price: parseFloat(p), size: parseFloat(s), total: parseFloat(p) * parseFloat(s)
        })));

        setTrades((tradesData || []).map(t => ({
          price: parseFloat(t.price),
          size: parseFloat(t.qty),
          isBuy: !t.isBuyerMaker,
          time: new Date(t.time)
        })));

        setCandles(prev => {
          if (!prev.length) return prev;
          const last = { ...prev[prev.length - 1] };
          last.close = mid || last.close;
          last.high = Math.max(last.high, mid || last.high);
          last.low = Math.min(last.low, mid || last.low);
          return [...prev.slice(0, -1), last];
        });
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return { price, stats, asks, bids, trades, candles, loading };
}
