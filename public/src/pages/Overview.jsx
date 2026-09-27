import React, { useState } from "react";

export default function CardFullPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    "What currencies does the Super App card support?",
    "Which currencies can be withdrawn from the Super App card?",
    "How can I send funds to the Super App card?",
    "Why is additional verification needed?",
    "How to top up the card's tariff plan?",
    "What additional security settings are there?",
  ];

  return (
    <div style={styles.page}>

      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.center}>
          <div style={styles.badge}>Quick card registration</div>

          <h1 style={styles.heroTitle}>
            Pay anywhere with the Super App card
          </h1>

          <p style={styles.heroSub}>
            The card allows you to make payments from numerous places around the world!
          </p>

          <button style={styles.primaryBtn}>Soon</button>

          <div style={styles.cardBox}>
            <div style={styles.glow}></div>

            <div style={styles.card}>
              <div style={styles.cardNumber}>0000 0000 0000 0000</div>
              <div style={styles.cardBottom}>
                <div style={styles.chip}></div>
                <div style={styles.visa}>VISA</div>
              </div>
            </div>

            <div style={styles.platform}></div>
          </div>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section style={styles.section}>
        <div style={styles.containerRow}>
          <h2 style={styles.title}>Explore the benefits</h2>

          <div style={styles.grid3}>
            {[
              {
                title: "Convenient withdrawals",
                text: "Convert your digital assets to cash and withdraw USD, EUR or GBP.",
              },
              {
                title: "Instant access to funds",
                text: "Withdraw up to 5,000 USD per day at Visa ATMs anywhere.",
              },
              {
                title: "Receive cashback",
                text: "Get lucrative cashback from relevant purchases",
              },
            ].map((item, i) => (
              <div key={i} style={styles.benefitCard}>
                <div style={styles.iconBox}>💳</div>
                <h4>{item.title}</h4>
                <p style={styles.muted}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROMO ================= */}
      <section style={styles.promo}>
        <div style={styles.promoInner}>
          <div style={styles.promoBadge}>Become an owner today</div>

          <h2 style={{ fontSize: 42 }}>500+</h2>

          <p style={styles.muted}>
            Users have already ordered the Super App card! Take the opportunity to be among the first.
          </p>

          <button style={styles.primaryBtn}>Soon</button>
        </div>
      </section>

      {/* ================= STEPS ================= */}
      <section style={styles.section}>
        <h2 style={styles.title}>How to get the card?</h2>

        <div style={styles.grid3}>
          {["Check requirements", "Complete verification", "Apply for KYC"].map(
            (t, i) => (
              <div key={i} style={styles.stepCard}>
                <div style={styles.circle}>{i + 1}</div>
                <h4>Step {i + 1}</h4>
                <p style={styles.muted}>{t}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ================= ROADMAP ================= */}
      <section style={styles.section}>
        <h2 style={styles.title}>Roadmap</h2>

        <div style={styles.roadmap}>
          <div>September 2024 - Launch card</div>
          <div>September 2024 - Apple Pay</div>
          <div>October 2025 - Loyalty program</div>
          <div>Coming soon</div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section style={styles.section}>
        <h2 style={styles.title}>Terms and Fees</h2>

        <div style={styles.grid2}>
          <div style={styles.plan}>
            <h3>Standard</h3>
            <p>VISA prepaid</p>
            <p>Validity: 3 years</p>
            <p>ATM fee: 2.8%</p>
          </div>

          <div style={styles.planVip}>
            <h3>VIP</h3>
            <p>Higher limits</p>
            <p>Priority support</p>
            <p>ATM fee: 2.8%</p>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section style={styles.section}>
        <h2 style={styles.title}>FAQ</h2>

        {faqs.map((q, i) => (
          <div key={i} style={styles.faq}>
            <div onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              {q}
            </div>

            {openFaq === i && (
              <p style={styles.muted}>
                This is a real explanation for the feature.
              </p>
            )}
          </div>
        ))}
      </section>

      {/* ================= CTA ================= */}
      <section style={styles.cta}>
        <h2>Quick card registration</h2>
        <p style={styles.muted}>Get the Super App card in a few simple steps</p>
        <button style={styles.primaryBtn}>Coming soon</button>
      </section>

    </div>
  );
}

const styles = {
  page: { fontFamily: "Arial", background: "#f5f6f8" },

  hero: { background: "#02040a", color: "white", padding: "80px 20px" },

  center: { textAlign: "center", maxWidth: 900, margin: "0 auto" },

  badge: {
    border: "1px solid #2b5cff",
    padding: "6px 14px",
    borderRadius: 20,
    display: "inline-block",
    marginBottom: 20,
  },

  heroTitle: { fontSize: 46, fontWeight: 800 },

  heroSub: { color: "#aaa", marginTop: 10 },

  primaryBtn: {
    marginTop: 20,
    background: "#1e78f0",
    color: "white",
    padding: "10px 25px",
    borderRadius: 8,
    border: "none",
  },

  cardBox: { marginTop: 50, position: "relative" },

  glow: {
    width: 400,
    height: 400,
    background: "radial-gradient(circle, #1e78f033, transparent)",
    position: "absolute",
  },

  card: {
    width: 400,
    height: 220,
    margin: "0 auto",
    background: "#222",
    borderRadius: 20,
    padding: 20,
  },

  cardNumber: { marginTop: 50, color: "#aaa", letterSpacing: 3 },

  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 40,
  },

  chip: { width: 40, height: 25, background: "#ddd" },

  visa: { fontWeight: "bold" },

  platform: {
    width: 300,
    height: 40,
    background: "#ffffff10",
    borderRadius: "50%",
    margin: "20px auto",
  },

  section: { padding: "50px 20px", textAlign: "center" },

  containerRow: { maxWidth: 1100, margin: "0 auto" },

  title: { fontSize: 28, marginBottom: 20 },

  grid3: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  benefitCard: {
    background: "white",
    padding: 20,
    borderRadius: 10,
    width: 280,
  },

  iconBox: {
    width: 50,
    height: 50,
    background: "#4b6cb7",
    borderRadius: 10,
    margin: "0 auto 10px",
  },

  muted: { color: "#666", fontSize: 14 },

  promo: {
    background: "#02040a",
    padding: 60,
    textAlign: "center",
  },

  promoInner: {
    background: "white",
    padding: 30,
    borderRadius: 20,
    display: "inline-block",
  },

  promoBadge: {
    background: "#6c6f91",
    color: "white",
    padding: "5px 12px",
    borderRadius: 20,
    marginBottom: 10,
  },

  stepCard: { width: 250 },

  circle: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#eee",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  roadmap: {
    display: "flex",
    gap: 20,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  grid2: {
    display: "flex",
    gap: 20,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  plan: { background: "white", padding: 20, borderRadius: 10 },

  planVip: {
    background: "white",
    padding: 20,
    borderRadius: 10,
    border: "2px solid #1e78f0",
  },

  faq: {
    background: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    cursor: "pointer",
  },

  cta: {
    background: "#02040a",
    color: "white",
    textAlign: "center",
    padding: 50,
  },
};