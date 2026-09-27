export default function MiniChart({ positive, width = 80, height = 32 }) {
  const color = positive ? "#22c55e" : "#ef4444";
  const bg = positive ? "#dcfce7" : "#fee2e2";
  const path = positive
    ? "M0,22 C12,18 24,20 36,12 C48,6 58,14 70,8 C80,4 90,10 110,3"
    : "M0,4 C12,8 24,5 36,12 C48,18 58,14 72,20 C85,24 95,21 110,26";
  return (
    <svg
      width={width} height={height}
      viewBox="0 0 110 30"
      className="mini-chart"
      style={{ background: bg }}
    >
      <path d={path} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
