import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";
 
const NAV_DROPDOWNS = {
  Trading: [
    { icon: "📊", title: "Markets", desc: "View the latest crypto prices", path: "/markets" },
    { icon: "🔄", title: "Swap", desc: "Quick conversion, zero trading fees", path: "/swap" },
    { icon: "🔵", title: "Spot", desc: "Buy and sell crypto with ease", path: "/spot" },
    { icon: "⚡", title: "Margin", desc: "Trade with leverage", path: "/" },
    { icon: "🏆", title: "Tournament", desc: "Increase your trading volume", path: "/" },
  ],
  Futures: [
    { icon: "📈", title: "USDT Perpetuals", desc: "Trade perpetual contracts", path: "/spot" },
  ],
  Tools: [
    { icon: "📊", title: "Market Cap", desc: "Crypto market cap rankings", path: "/tools/market-cap" },
    { icon: "🖥️", title: "Market Screener", desc: "Scan markets with advanced filters", path: "/tools/screener" },
    { icon: "🔄", title: "Cross Rates", desc: "Live forex cross rate matrix", path: "/tools/cross-rates" },
    { icon: "🌡️", title: "Currency Heatmap", desc: "Visualize currency strength", path: "/tools/heatmap" },
    { icon: "📐", title: "Technical Analysis", desc: "Buy/sell signals for top crypto", path: "/tools/technical" },
  ],
  Earn: [
    { icon: "💰", title: "Staking", desc: "Earn rewards by staking crypto", path: "/earn/staking" },
    { icon: "🏦", title: "Crypto Lending", desc: "Earn interest on idle assets", path: "/earn/crypto-lending" },
  ],
  "Buy Crypto": [
    { icon: "💳", title: "Fiat Deposit", desc: "Buy crypto via Bank Transfer or Card", path: "/profile/wallet?action=deposit" },
    { icon: "🤝", title: "P2P Trading", desc: "Trade with other users", path: "/" },
  ],
  // Documentation: [
  //   { icon: "📖", title: "API Docs", desc: "Integrate with our trading API", path: "/" },
  //   { icon: "❓", title: "Help Center", desc: "Find answers to common questions", path: "/" },
  // ],
  "Our card": [
    { icon: "🔥", title: "Overview", desc: "Pay with crypto anywhere", path: "/overview" },
  ],
};
 
const NAV_ITEMS = [
  { label: "Trading", hasDropdown: true },
  { label: "Futures", hasDropdown: true },
  { label: "Tools", hasDropdown: true },
  { label: "Earn", hasDropdown: true },
  { label: "Buy Crypto", hasDropdown: true },
  // { label: "Documentation", hasDropdown: true },
  { label: "Our card", hasDropdown: true },
];
 
// ── Language list ──
const LANGUAGES = [
  { code: "en",    label: "EN", name: "English"    },
  { code: "tr",    label: "TR", name: "Türkçe"     },
  { code: "de",    label: "DE", name: "Deutsch"    },
  { code: "es",    label: "ES", name: "Español"    },
  { code: "it",    label: "IT", name: "Italiano"   },
  { code: "fr",    label: "FR", name: "Français"   },
  { code: "pt",    label: "PT", name: "Portuguese" },
  { code: "zh-TW", label: "ZH", name: "繁體中文"   },
  { code: "ja",    label: "JA", name: "日本語"     },
];
 
// ── History menu items ──
const HISTORY_ITEMS = [
  { label: "All transactions", path: "/history" },
  { label: "Deposits",         path: "/history/deposits" },
  { label: "Withdrawals",      path: "/history/withdrawals" },
  { label: "Transfers",        path: "/history/transfers" },
  { label: "Earnings",         path: "/history/earnings" },
];
 
export default function Navbar() {
  const [activeDD, setActiveDD] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobExp, setMobExp] = useState(null);
  const [assetsOpen, setAssetsOpen] = useState(false);
  // const { isLoggedIn, logout } = useAuth();
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const assetsRef = useRef(null);
  const [dynamicPages, setDynamicPages] = useState([]);
  const [navBalance, setNavBalance] = useState(0);
  const [navBalLoading, setNavBalLoading] = useState(true);
 
  useEffect(() => {
    const fn = (e) => {
      if (assetsRef.current && !assetsRef.current.contains(e.target)) {
        setAssetsOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
 
  //logo dynamics
  const [company, setCompany] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
 
  useEffect(() => {
    fetch(`${API}/api/company`)
      .then(res => res.json())
      .then(data => setCompany(data))
      .catch(() => {});
  }, []);
 
  const SYMBOL_TO_ID = {
    BTC:"bitcoin", ETH:"ethereum", BNB:"binancecoin", SOL:"solana", XRP:"ripple",
    DOGE:"dogecoin", ADA:"cardano", TRX:"tron", AVAX:"avalanche-2", DOT:"polkadot",
    LINK:"chainlink", UNI:"uniswap", LTC:"litecoin", NEAR:"near", APT:"aptos",
    SUI:"sui", FET:"fetch-ai", PEPE:"pepe", SHIB:"shiba-inu", TON:"toncoin",
    ICP:"internet-computer", BCH:"bitcoin-cash", WBTC:"wrapped-bitcoin", USDC:"usd-coin",
    MATIC:"matic-network", ATOM:"cosmos", FIL:"filecoin", ARB:"arbitrum", OP:"optimism",
    INJ:"injective-protocol", RUNE:"thorchain", EOS:"eos", XLM:"stellar", FTM:"fantom",
    ALGO:"algorand", HBAR:"hedera-hashgraph", VET:"vechain", THETA:"theta-token",
    GRT:"the-graph", SAND:"the-sandbox", MANA:"decentraland", AXS:"axie-infinity",
    ENJ:"enjincoin", BAT:"basic-attention-token", ZIL:"zilliqa", IOST:"iost",
    ONT:"ontology", WAVES:"waves", NEO:"neo", KSM:"kusama", CRO:"crypto-com-chain",
    CAKE:"pancakeswap-token", KAVA:"kava", ANKR:"ankr", COMP:"compound-governance-token",
    MKR:"maker", SUSHI:"sushi", YFI:"yearn-finance", SNX:"synthetix-network-token",
    USTC:"terrausd", LUNA:"terra-luna", FTT:"ftx-token", LEO:"leo-token",
    BTT:"bittorrent", XMR:"monero", ZEC:"zcash", DASH:"dash", ETC:"ethereum-classic",
  };

  useEffect(() => {
    if (!user?.uid) { setNavBalLoading(false); return; }
    setNavBalLoading(true);
    fetch(`${API}/api/users/balance?uid=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        const coinFields = Object.keys(d).filter(k => k.endsWith("Balance") && k !== "USDTBalance");
        const ids = coinFields.map(k => SYMBOL_TO_ID[k.replace("Balance", "")] || k.replace("Balance", "").toLowerCase()).filter(Boolean).join(",");
        if (ids) {
          fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
            .then(r => r.json())
            .then(prices => {
              let total = d.balance || 0;
              coinFields.forEach(f => {
                const sym = f.replace("Balance", "");
                const coinId = SYMBOL_TO_ID[sym] || sym.toLowerCase();
                const price = prices[coinId]?.usd || 0;
                total += (d[f] || 0) * price;
              });
              setNavBalance(total);
            })
            .catch(() => setNavBalance(d.balance || 0));
        } else {
          setNavBalance(d.balance || 0);
        }
      })
      .catch(() => {})
      .finally(() => setNavBalLoading(false));
  }, [user?.uid]);

  // dynamic pages
  useEffect(() => {
    fetch(`${API}/api/pages`)
      .then(res => res.json())
      .then(data => {
        const headerPages = (data || []).filter(p => p.showInHeader);
        setDynamicPages(headerPages);
      })
      .catch(() => {});
  }, []);
 
  //dynamics favicons
  useEffect(() => {
    if (!company) return;
 
    // TITLE
    if (company?.name) {
      document.title = company.name;
    }
 
    // FAVICON
    if (company?.logo?.favicon) {
      let link = document.querySelector("link[rel='icon']");
 
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
 
      link.href = company.logo.favicon;
      link.type = "image/png";
    }
  }, [company]);
 
  // Profile dropdown outside click handler
  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
 
  // ── HISTORY dropdown state & outside click ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef(null);
 
  useEffect(() => {
    const fn = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
 
  // ── LANGUAGE state & outside click ──
  const [selectedLang, setSelectedLang] = useState(
    () =>
      LANGUAGES.find(l => l.code === (localStorage.getItem("siteLang") || "en")) ||
      LANGUAGES[0]
  );
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
 
  useEffect(() => {
    const fn = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
 
  // Load Google Translate script once on mount
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;
 
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
    };
 
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, []);
 
  // Trigger Google Translate programmatically
  const applyGoogleTranslate = (langCode) => {
    const trySet = () => {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = langCode === "en" ? "" : langCode;
        select.dispatchEvent(new Event("change"));
        return true;
      }
      return false;
    };
    if (!trySet()) {
      setTimeout(trySet, 800);
    }
  };
 
  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    setLangOpen(false);
    localStorage.setItem("siteLang", lang.code);
    applyGoogleTranslate(lang.code);
  };
 
  const handleLogout = () => {
    logout();
    setAssetsOpen(false);
    setMobileOpen(false);
    navigate("/");
  };
 
  // Email masking helper
  const maskEmail = (email) => {
    if (!email) return "user@****";
    const [name] = email.split("@");
    return name.slice(0, 3) + "***@****";
  };
 
  const dynamicMenus = {};
 
  dynamicPages.forEach((p) => {
    if (!p.headerMenu) return;
 
    if (!dynamicMenus[p.headerMenu]) {
      dynamicMenus[p.headerMenu] = [];
    }
 
    dynamicMenus[p.headerMenu].push({
      icon: "📄",
      title: p.title,
      desc: "Dynamic page",
      path: `/page/${p.slug}`,
    });
  });
 
  const FINAL_NAV_ITEMS = [
    ...NAV_ITEMS,
    ...Object.keys(dynamicMenus).map((menu) => ({
      label: menu,
      hasDropdown: true,
    })),
  ];
 
  const FINAL_NAV_DROPDOWNS = {
    ...NAV_DROPDOWNS,
    ...dynamicMenus,
  };
 
  return (
    <nav className="navbar">
      <div className="navbar-inner">
      {/* Hidden Google Translate widget container */}
      <div id="google_translate_element" style={{ display: "none" }} />

      {/* Logo */}
      <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
        {company?.logo?.light ? (
          <img
            src={company.logo.light}
            alt="logo"
            style={{ height: 32 }}
          />
        ) : (
          <div className="navbar-logo-box">✕</div>
        )}
 
        <span className="navbar-logo-text">
          {company?.name || "Super App"}
        </span>
      </Link>
 
      {/* Desktop nav links */}
      <div className="navbar-links hidden lg:flex">
        {FINAL_NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className="nav-item"
            onMouseEnter={() => item.hasDropdown && setActiveDD(item.label)}
            onMouseLeave={() => setActiveDD(null)}
          >
            <button className="nav-btn">
              {item.icon && <span style={{ marginRight: 2 }}>{item.icon}</span>}
              {item.label}
              <span className="nav-arrow">▾</span>
            </button>
 
            {activeDD === item.label && (
              <div className="nav-dropdown">
                {(FINAL_NAV_DROPDOWNS[item.label] || []).map((d) => (
                  <div
                    key={d.title}
                    className="dropdown-item"
                    onClick={() => {
                      navigate(d.path);
                      setActiveDD(null);
                    }}
                  >
                    <div className="dropdown-icon">{d.icon}</div>
                    <div>
                      <div className="dropdown-title">{d.title}</div>
                      <div className="dropdown-desc">{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
 
      {/* Right side */}
      <div className="navbar-right">
 
        {/*  Login / Sign Up */}
        {!isLoggedIn && (
          <>
            <Link to="/login" className="btn-login">
              Log In
            </Link>
            <Link to="/signup" className="btn-signup">
              Sign Up
            </Link>
          </>
        )}
 
        {/* logged-in actions */}
        {isLoggedIn && (
          <>
            <button className="nb-deposit-btn hidden lg:inline-flex" onClick={() => navigate("/profile/wallet?action=deposit")}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Deposit
            </button>
 
            <div className="nb-dd-wrap" ref={assetsRef}>
              <button className="nb-text-btn hidden lg:inline-flex" onClick={() => setAssetsOpen((o) => !o)}>
                Assets <span className="nb-chevron">{assetsOpen ? "▲" : "▾"}</span>
              </button>
 
              {assetsOpen && (
                <div className="nb-assets-drop">
                  <div className="nad-header">
                    <span className="nad-title">Assets Overview</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#666"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                    </svg>
                  </div>

                  <div className="nad-balance">
                    {navBalLoading ? "—" : navBalance.toFixed(2)} <span style={{ fontSize: 20 }}>USD</span>
                  </div>
                  <div className="nad-btc">≈ {navBalLoading ? "—" : (navBalance / 80000).toFixed(4)} BTC</div>
                  <p className="nad-note">*Data may be delayed.</p>

                  <div className="nad-btn-row">
                    <button
                      className="nad-action-btn"
                      onClick={() => {
                        setAssetsOpen(false);
                        navigate("/profile/wallet?action=deposit");
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Deposit
                    </button>

                    <button
                      className="nad-action-btn"
                      onClick={() => {
                        setAssetsOpen(false);
                        navigate("/profile");
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Withdraw
                    </button>
                  </div>

                  <div className="nad-divider" />

                  {[
                    ["Spot", "100%", navBalance],
                    ["Margin", "0.0%", 0],
                    ["Futures", "0.0%", 0],
                    ["Earn", "0.0%", 0],
                  ].map(([lbl, pct, val]) => (
                    <div key={lbl} className="nad-item">
                      <div>
                        <div className="nad-item-lbl">{lbl}</div>
                        <div className="nad-item-pct">{pct}</div>
                      </div>
                      <div className="nad-item-val">${(val || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            {/* ── HISTORY DROPDOWN ── */}
            <div className="relative" ref={historyRef}>
              <button
                className="nb-text-btn hidden lg:inline-flex"
                onClick={() => setHistoryOpen((o) => !o)}
              >
                History{" "}
                <span className="nb-chevron">{historyOpen ? "▲" : "▾"}</span>
              </button>
 
              {historyOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-[#1a1d24] border border-[#2d3148] rounded-xl z-[999] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {HISTORY_ITEMS.map((item, idx) => (
                    <div key={item.label}>
                      <div
                        className="flex items-center justify-between px-5 py-4 text-[#ccc] text-sm cursor-pointer hover:bg-[#22263a] hover:text-white transition-colors duration-150"
                        onClick={() => {
                          navigate(item.path);
                          setHistoryOpen(false);
                        }}
                      >
                        <span>{item.label}</span>
                        <span className="text-[#555] text-lg">›</span>
                      </div>
                      {idx < HISTORY_ITEMS.length - 1 && (
                        <div className="h-px bg-[#2d3148] mx-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* ── END HISTORY DROPDOWN ── */}
 
            {/* ── PROFILE AVATAR + DROPDOWN ── */}
            <div className="relative" ref={profileRef}>
              <div
                className="cursor-pointer w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#4a5568] text-white text-sm font-bold"
                onClick={() => setProfileOpen((o) => !o)}
              >
                {user?.photo ? (
                  <img src={user.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user?.name || user?.email || "U").slice(0, 2).toUpperCase()
                )}
              </div>
 
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-72 bg-[#1a1d24] border border-[#2d3148] rounded-xl z-[999] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
 
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-4 bg-[#22263a]">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-[#4a5568] text-white text-sm font-bold shrink-0">
                      {user?.photo ? (
                        <img src={user.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user?.name || user?.email || "U").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">
                        {user?.name || user?.email?.split("@")[0] || "User"}
                      </div>
                      <div className="text-[#888] text-xs truncate">
                        {user?.email || ""}
                      </div>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[11px] text-red-400 border border-red-400 rounded px-1.5 py-0.5">
                          VIP
                        </span>
                        <span className="text-[11px] text-green-400 border border-green-400 rounded px-1.5 py-0.5">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
 
                  {/* Divider */}
                  <div className="h-px bg-[#2d3148]" />
 
                  {/* Menu Items */}
                  {[
                    { label: "Wallet",                path: "/profile/wallet" },
                    { label: "Settings",              path: "/settings" },
                    { label: "Security",              path: "/security" },
                    { label: "Identity Verification", path: "/kyc" },
                    { label: "Referral program",      path: "/referral" },
                    { label: "API Management",        path: "/api-management" },
                    { label: "Mobile app",            path: "/mobile-app" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-4 py-3 text-[#ccc] text-sm cursor-pointer hover:bg-[#22263a] hover:text-white transition-colors duration-150"
                      onClick={() => { navigate(item.path); setProfileOpen(false); }}
                    >
                      <span>{item.label}</span>
                      <span className="text-[#555] text-lg">›</span>
                    </div>
                  ))}
 
                  {/* Divider */}
                  <div className="h-px bg-[#2d3148]" />
 
                  {/* Logout */}
                  <div
                    className="flex items-center justify-center px-4 py-3 text-[#aaa] text-sm cursor-pointer hover:bg-[#22263a] hover:text-white transition-colors duration-150"
                    onClick={handleLogout}
                  >
                    Log out
                  </div>
 
                </div>
              )}
            </div>
            {/* ── END PROFILE DROPDOWN ── */}
 
            <button className="btn-signup" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
 
        {/* ── LANGUAGE SWITCHER ── */}
        <div className="relative" ref={langRef}>
          <button
            className="navbar-lang hidden lg:flex items-center gap-1 cursor-pointer select-none"
            onClick={() => setLangOpen((o) => !o)}
          >
            {selectedLang.label}
            <span className="text-[10px] opacity-60">{langOpen ? "▲" : "▾"}</span>
          </button>
 
          {langOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-48 bg-[#1a1d24] border border-[#2d3148] rounded-xl z-[999] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {LANGUAGES.map((lang, idx) => (
                <div key={lang.code}>
                  <div
                    className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors duration-150 ${
                      selectedLang.code === lang.code
                        ? "bg-[#22263a] text-white"
                        : "text-[#ccc] hover:bg-[#22263a] hover:text-white"
                    }`}
                    onClick={() => handleLangSelect(lang)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#666] w-5 shrink-0">
                        {lang.label}
                      </span>
                      <span>{lang.name}</span>
                    </div>
                    {selectedLang.code === lang.code && (
                      <span className="text-blue-400 text-xs ml-2">✓</span>
                    )}
                  </div>
                  {idx < LANGUAGES.length - 1 && (
                    <div className="h-px bg-[#2d3148] mx-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ── END LANGUAGE SWITCHER ── */}
 
        <button className="hamburger lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>
 
      {/* Mobile menu — always fully expanded, no hidden accordion */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, top: 56, zIndex: 90, background: "rgba(0,0,0,0.5)" }}
          />
          <div className="mobile-menu" style={{ zIndex: 100 }}>
            {FINAL_NAV_ITEMS.map((item) => {
              const kids = FINAL_NAV_DROPDOWNS[item.label] || [];
              return (
                <div key={item.label} className="mobile-menu-section">
                  <div className="mobile-menu-header" style={{ cursor: "default" }}>
                    {item.icon && <span style={{ marginRight: 6 }}>{item.icon}</span>}
                    {item.label}
                  </div>
                  {kids.map((d) => (
                    <div
                      key={d.title}
                      className="mobile-submenu-item"
                      onClick={() => {
                        navigate(d.path);
                        setMobileOpen(false);
                      }}
                    >
                      <span className="mobile-sub-icon">{d.icon}</span>
                      <span>{d.title}</span>
                    </div>
                  ))}
                  {kids.length === 0 && (
                    <div
                      className="mobile-submenu-item"
                      onClick={() => { navigate("/"); setMobileOpen(false); }}
                    >
                      <span className="mobile-sub-icon">•</span>
                      <span>{item.label} Home</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoggedIn && (
              <div className="mobile-menu-section" style={{ borderTop: "1px solid #2d3148" }}>
                <button
                  className="mobile-submenu-item"
                  style={{ width: "100%", background: "none", border: "none", textAlign: "left" }}
                  onClick={() => { navigate("/profile/wallet?action=deposit"); setMobileOpen(false); }}
                >
                  <span className="mobile-sub-icon">＋</span><span>Deposit</span>
                </button>
                <button
                  className="mobile-submenu-item"
                  style={{ width: "100%", background: "none", border: "none", textAlign: "left" }}
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                >
                  <span className="mobile-sub-icon">⏻</span><span>Logout</span>
                </button>
              </div>
            )}

            <div className="mobile-auth-btns">
              {!isLoggedIn && (
                <>
                  <Link to="/login" className="btn-login" style={{ flex: 1, textAlign: "center", display: "block" }}
                        onClick={() => setMobileOpen(false)}>Log In</Link>
                  <Link to="/signup" className="btn-signup" style={{ flex: 1, textAlign: "center", display: "block" }}
                        onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
      </div>
        </nav>
  );
}