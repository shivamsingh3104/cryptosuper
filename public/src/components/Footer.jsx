import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../config/api";

// Icons
import { FiMail, FiPhone } from "react-icons/fi";
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

/* ---------------- STATIC (UNCHANGED) ---------------- */
const cols = [
  {
    title: "Trading",
    links: [
      { label: "Markets", href: "/markets" },
      { label: "Swap", href: "/swap" },
      { label: "Spot", href: "/spot" },
      { label: "Margin", href: "#" },
      { label: "Futures", href: "#" },
      { label: "Tournament", href: "/tournament" },
      { label: "P2P", href: "#" },
      { label: "Buy Crypto", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Verify Official Channels", href: "/verify" },
      { label: "Fees", href: "/fees" },
      { label: "Bug Bounty", href: "/bug-bounty" },
      { label: "Corporate Identity", href: "/corporate-identity" },
      { label: "Institutional Services", href: "/institutional-services" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Staking", href: "/earn/staking" },
      { label: "Crypto Lending", href: "/earn/crypto-lending" },
      { label: "Referral Program", href: "#" },
      { label: "Token Listing", href: "/token-listing" },
    ],
  },
  {
    title: "Legal & Disclosures",
    links: [], // ✅ Static items removed, 
  },
];

export default function Footer() {
  const [company, setCompany] = useState({});
  const [dynamicFooterPages, setDynamicFooterPages] = useState([]);
  
  // Responsive check
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  /* ---------------- FETCH COMPANY (DYNAMIC DATA) ---------------- */
  useEffect(() => {
    fetch(`${API}/api/company`)
      .then(res => res.json())
      .then(data => setCompany(data || {}))
      .catch(() => {});
  }, []);

  /* ---------------- FETCH DYNAMIC FOOTER PAGES ---------------- */
  useEffect(() => {
    fetch(`${API}/api/pages`)
      .then(res => res.json())
      .then(data => {
        const footerPages = (data || []).filter(p => p.showInFooter);
        setDynamicFooterPages(footerPages);
      })
      .catch(() => {});

    // Resize listener for responsiveness
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------- MERGE STATIC + DYNAMIC ---------------- */
  const dynamicCols = JSON.parse(JSON.stringify(cols)); 

  dynamicFooterPages.forEach((p) => {
    if (!p.footerColumn) return;
    let existingCol = dynamicCols.find(c => c.title === p.footerColumn);
    if (!existingCol) {
      existingCol = { title: p.footerColumn, links: [] };
      dynamicCols.push(existingCol);
    }
    existingCol.links.push({
      label: p.title,
      href: `/page/${p.slug}`,
    });
  });

  const isMobile = windowWidth < 1024;

  /* ---------------- UI ---------------- */
  return (
    <footer className="footer" style={{ backgroundColor: "#0b0f2a", paddingTop: "40px", paddingBottom: "20px" }}>
      <div
        className="footer-inner"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px"
        }}
      >

        {/* TOP SECTION */}
        <div
          className="footer-top"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
            gap: isMobile ? "30px" : "40px"
          }}
        >

          {/* LEFT BRAND */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {company?.logo?.light ? (
                <img src={company.logo.light} alt="logo" style={{ height: 32 }} />
              ) : (
                <div className="navbar-logo-box">✕</div>
              )}

              <span style={{ fontWeight: 600, color: "#fff" }}>
                {company?.name || "Super App"}
              </span>
            </div>

            {company?.tagline && (
              <p style={{ marginTop: 10, color: "#bbb", fontSize: 13 }}>
                {company.tagline}
              </p>
            )}

            {company?.about && (
              <p
                style={{
                  marginTop: 6,
                  color: "#999",
                  fontSize: 12,
                  lineHeight: "18px",
                  maxWidth: isMobile ? "100%" : 260,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {company.about}
              </p>
            )}

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiMail size={14} color="#bbb" />
                <span style={{ color: "#ccc", fontSize: 13 }}>
                  {company?.contact?.supportEmail || "support@email.com"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiPhone size={14} color="#bbb" />
                <span style={{ color: "#ccc", fontSize: 13 }}>
                  {company?.contact?.phone || "+91 0000000000"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <a href={company?.social?.instagram || "#"}>
                <FaInstagram size={16} color="#bbb" />
              </a>
              <a href={company?.social?.linkedin || "#"}>
                <FaLinkedin size={16} color="#bbb" />
              </a>
              <a href={company?.social?.twitter || "#"}>
                <FaTwitter size={16} color="#bbb" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMNS */}
          <div
            className="footer-cols"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, minmax(120px, 1fr))",
              gap: "30px"
            }}
          >
            {dynamicCols.map((col) => (
              <div key={col.title} className="footer-col">
                <h4 className="footer-col-title" style={{ color: "#fff", marginBottom: "12px", fontSize: "14px", fontWeight: "bold" }}>
                  {col.title}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {col.links.map((link) => (
                    <a key={link.label} href={link.href} className="footer-col-link" style={{ color: "#999", fontSize: "13px", textDecoration: "none" }}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div
          className="footer-bottom"
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 40,
            borderTop: "1px solid #222",
            paddingTop: 12,
            gap: isMobile ? "10px" : "0"
          }}
        >
          <span style={{ color: "#aaa", fontSize: 13, textAlign: isMobile ? "center" : "left" }}>
            © 2025 {company?.name || "Super App"} | All rights reserved
          </span>

          <div style={{ color: "#bbb", fontSize: 13, textAlign: isMobile ? "center" : "right" }}>
            {company?.address?.registered}, {company?.address?.city}, {company?.address?.state}, {company?.address?.country}
          </div>
        </div>

      </div>
    </footer>
  );
}