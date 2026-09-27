import React from "react";
import {
  ShieldCheck,
  ScanLine,
  Banknote,
  ShieldAlert,
  BadgeCheck,
  History,
  Wallet,
  Users,
  ArrowRight,
  X,
} from "lucide-react";

const stats = [
  { value: "150+", label: "assets" },
  { value: "200+", label: "trading pairs" },
  { value: "3+", label: "national currencies" },
  { value: "$2.5+ mil", label: "24-hour trading volume" },
];

const securityItems = [
  { icon: <Wallet size={18} />, text: "We store 96% of assets in cold wallets" },
  { icon: <ShieldCheck size={18} />, text: "We counteract hacker attacks with WAF" },
  { icon: <BadgeCheck size={18} />, text: "We comply with the standards of the Financial Action Task Force (FATF)" },
  { icon: <ScanLine size={18} />, text: "We verify assets using AML systems" },
];

const timeline = [
  {
    date: "16 January 2022",
    title: "Launch of Super App exchange",
    text: "The start of the journey from a startup to one of the largest European crypto platforms",
  },
  {
    date: "February 2022",
    title: "Release of Super App Earn",
    text: "Added a tool for passive income on cryptocurrency",
  },
  {
    date: "February 2022",
    title: "Implementation of AML address verification",
    text: "Added the ability to check crypto addresses for involvement in money laundering",
  },
  {
    date: "March 2023",
    title: "First trading pairs with hryvnia",
    text: "Trading in hryvnia pairs with the most popular assets became available",
  },
  {
    date: "March 2023",
    title: "Launch of more pairs",
    text: "Users gained even more flexible borrowing and exchange options",
  },
];

const cardBase = {
  background: "#ffffff",
  borderRadius: "20px",
  boxShadow: "0 1px 0 rgba(16,24,40,0.02)",
};

export default function AboutUsPageClone() {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.heroInner}>
            <div style={styles.eyebrow}>ABOUT US</div>
            <h1 style={styles.heroTitle}>Hello! Let&apos;s get acquainted</h1>
            <p style={styles.heroText}>
              The Super App exchange, founded in Europe in 2022, believes in the future of blockchain and strives to make it accessible to everyone. The exchange quickly took leading positions thanks to its strategy focused on transparency and security.
            </p>

            <div style={styles.statsGrid}>
              {stats.map((s) => (
                <div key={s.label} style={styles.statItem}>
                  <div style={styles.statValue}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main style={styles.container}>
        <section style={styles.securitySection}>
          <div style={styles.sectionKicker}>WE WORK 24/7 TO PROTECT YOUR FUNDS</div>
          <h2 style={styles.sectionTitle}>Security</h2>

          <div style={styles.securityGrid}>
            {securityItems.map((item, idx) => (
              <div key={idx} style={styles.securityItem}>
                <div style={styles.securityIcon}>{item.icon}</div>
                <div style={styles.securityText}>{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardBase, ...styles.trustCard }}>
          <div style={styles.trustKicker}>MORE THAN JUST AN EXCHANGE</div>
          <div style={styles.trustText}>
            We value your trust, so we do everything to ensure convenience, transparency, and security of all operations
          </div>
        </section>

        <section style={styles.historySection}>
          <h2 style={styles.historyTitle}>Writing history together</h2>

          <div style={styles.timelineWrap}>
            <div style={styles.timelineLine} />
            {timeline.map((item, idx) => (
              <div key={idx} style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div style={styles.timelineDate}>{item.date}</div>
                <div style={styles.timelineCardTitle}>{item.title}</div>
                <div style={styles.timelineText}>{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardBase, ...styles.ctaCard }}>
          <div style={styles.ctaLogoWrap}>
            <div style={styles.ctaLogoMark}>
              <X size={56} strokeWidth={3} />
            </div>
            <div style={styles.ctaLogoText}>Super App</div>
          </div>

          <h3 style={styles.ctaTitle}>Are you with us?</h3>
          <p style={styles.ctaText}>
            Register, get acquainted with unique tools and a variety of cryptocurrencies, and our support service is with you 24/7
          </p>
          <button type="button" style={styles.ctaButton}>
            I&apos;m already with you
          </button>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f7",
    color: "#111111",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
  },
  hero: {
    background: "#171634",
    color: "white",
    padding: "42px 0 54px",
  },
  heroInner: {
    textAlign: "center",
    maxWidth: 760,
    margin: "0 auto",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.12em",
    opacity: 0.72,
    marginBottom: 12,
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(28px, 3.7vw, 54px)",
    lineHeight: 1.05,
    fontWeight: 800,
  },
  heroText: {
    margin: "12px auto 0",
    maxWidth: 700,
    fontSize: 14,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.75)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 20,
    marginTop: 34,
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
  securitySection: {
    padding: "58px 0 20px",
  },
  sectionKicker: {
    fontSize: 10,
    letterSpacing: "0.08em",
    color: "#6d6d76",
    marginBottom: 8,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
  },
  securityGrid: {
    marginTop: 34,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 28,
  },
  securityItem: {
    minHeight: 120,
  },
  securityIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#f57f5e",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  securityText: {
    fontSize: 13,
    lineHeight: 1.55,
    color: "#2b2b33",
    maxWidth: 220,
  },
  trustCard: {
    marginTop: 28,
    padding: "28px 20px",
    textAlign: "center",
  },
  trustKicker: {
    fontSize: 10,
    letterSpacing: "0.08em",
    color: "#8a8a95",
    marginBottom: 10,
  },
  trustText: {
    fontSize: "clamp(22px, 2.2vw, 28px)",
    lineHeight: 1.18,
    fontWeight: 800,
    maxWidth: 980,
    margin: "0 auto",
  },
  historySection: {
    padding: "38px 0 36px",
  },
  historyTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
    marginBottom: 32,
  },
  timelineWrap: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
    gap: 18,
    overflowX: "auto",
    paddingBottom: 10,
  },
  timelineLine: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 22,
    height: 4,
    background: "#d8dbe4",
    borderRadius: 999,
  },
  timelineItem: {
    position: "relative",
    paddingTop: 26,
    minWidth: 180,
  },
  timelineDot: {
    position: "absolute",
    top: 16,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#d7df43",
    zIndex: 1,
  },
  timelineDate: {
    display: "inline-block",
    fontSize: 11,
    lineHeight: 1,
    padding: "5px 10px",
    borderRadius: 999,
    background: "#dfe76a",
    color: "#2f3310",
    fontWeight: 700,
    marginBottom: 12,
  },
  timelineCardTitle: {
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 800,
    color: "#1c1c1f",
    marginBottom: 8,
    maxWidth: 190,
  },
  timelineText: {
    fontSize: 12,
    lineHeight: 1.55,
    color: "#6b6f79",
    maxWidth: 190,
  },
  ctaCard: {
    margin: "26px 0 34px",
    background: "#1a1840",
    color: "white",
    padding: "42px 20px 34px",
    textAlign: "center",
  },
  ctaLogoWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    marginBottom: 18,
  },
  ctaLogoMark: {
    color: "#ffffff",
    lineHeight: 0,
    marginBottom: 4,
  },
  ctaLogoText: {
    fontSize: 28,
    fontWeight: 700,
  },
  ctaTitle: {
    margin: "14px 0 8px",
    fontSize: "clamp(22px, 2.3vw, 32px)",
    lineHeight: 1.15,
    fontWeight: 800,
  },
  ctaText: {
    margin: "0 auto",
    maxWidth: 420,
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.68)",
  },
  ctaButton: {
    marginTop: 18,
    border: 0,
    borderRadius: 8,
    background: "#1e78f0",
    color: "#fff",
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};

if (typeof window !== "undefined") {
  const media = window.matchMedia("(max-width: 900px)");
  const applyResponsive = () => {
    const small = media.matches;
    styles.statsGrid.gridTemplateColumns = small ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))";
    styles.securityGrid.gridTemplateColumns = small ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))";
    styles.timelineWrap.gridTemplateColumns = small ? "repeat(5, 200px)" : "repeat(5, minmax(180px, 1fr))";
  };
  applyResponsive();
  media.addEventListener?.("change", applyResponsive);
}
