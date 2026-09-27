export default function SparklineChart({ data = [], positive, width = 80, height = 32 }) {
  const color = positive ? "#22c55e" : "#ef4444";
  const bg    = positive ? "#dcfce7" : "#fee2e2";

  // Use last 24 points from sparkline (7d data → take last 24 points ≈ last day)
  const pts = (data.length > 24 ? data.slice(-24) : data);

  if (pts.length < 2) {
    // fallback static line
    const fallPath = positive
      ? "M0,22 C20,18 40,12 60,8 C80,4 100,10 110,3"
      : "M0,4 C20,8 40,14 60,18 C80,22 100,20 110,26";
    return (
      <svg width={width} height={height} viewBox="0 0 110 30"
        style={{ background: bg, borderRadius: 6, display: "block" }}>
        <path d={fallPath} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const W = 110, H = 30, PAD = 3;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const points = pts.map((v, i) => {
    const x = PAD + (i / (pts.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaClose = `${W - PAD},${H} ${PAD},${H}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}
      style={{ background: bg, borderRadius: 6, display: "block" }}>
      <defs>
        <linearGradient id={`sg-${positive ? "p" : "n"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${points[0]} ${polyline} ${areaClose}`}
        fill={`url(#sg-${positive ? "p" : "n"})`} />
      <polyline points={polyline} fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
