import { useState, useEffect, useCallback } from "react";
import AdminLogin from "./AdminLogin";
import UsersSection from "./UsersSection";
import StatsSection from "./StatsSection";
import EmployeesSection from "./EmployeesSection";
import CompanySettings from "./companysettings/CompanySettings";
import Pages from "./pages/Pages";
import { API } from "../../config/api";
import WalletForm from "../../components/WalletForm";
import SwapSection from "./SwapSection";
import MarketFeesSection from "./MarketFeesSection";
import DepositsSection from "./DepositsSection";
import CreditUserSection from "./CreditUserSection";
import WithdrawalsSection from "./WithdrawalsSection";
import StakingRatesSection from "./StakingRatesSection";

export default function AdminDashboard() {

  const [authed, setAuthed] = useState(
    () => localStorage.getItem("adminAuth") === "true"
  );

  const [tab, setTab] = useState("users");

  const [company, setCompany] = useState(null);

  // ✅ MOBILE SIDEBAR
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/company`)
      .then(res => res.json())
      .then(data => setCompany(data))
      .catch(() => {});
  }, []);

  // Pending counts — admin ko sidebar se hi pata chale ki kitne requests
  // approve hone baaki hain, warna use har tab manually check karta.
  const [pendingCounts, setPendingCounts] = useState({ deposits: 0, withdrawals: 0 });

  const fetchPendingCounts = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    const h = { "x-admin-token": token };
    Promise.all([
      fetch(`${API}/api/admin/deposits`, { headers: h }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/admin/withdrawals`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([deps, wds]) => {
      const count = arr => (Array.isArray(arr) ? arr.filter(x => x.status === "pending").length : 0);
      setPendingCounts({ deposits: count(deps), withdrawals: count(wds) });
    });
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 10000);
    return () => clearInterval(interval);
  }, [authed, fetchPendingCounts]);

  // Ek tab me approve/reject hone par doosre tab ka badge turant stale ho jata
  // hai, isliye tab badalte hi dobara count karte hain.
  useEffect(() => {
    if (authed && (tab === "deposits" || tab === "withdrawals")) fetchPendingCounts();
  }, [tab, authed, fetchPendingCounts]);

  // authFetch koi /api/admin/ call par 401 de to token hi clear kar deta hai.
  // Ye state nahi badalta, isliye mounted dashboard khali tables dikhata rehta
  // tha — event sun ke turant login screen par bhej dete hain.
  useEffect(() => {
    const onExpired = () => setAuthed(false);
    window.addEventListener("kepwix:admin-session-expired", onExpired);
    return () => window.removeEventListener("kepwix:admin-session-expired", onExpired);
  }, []);

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div className="adm-page">

      {/* ✅ TOGGLE BUTTON */}
      <button
        className="md:hidden fixed top-4 left-4 z-[3000] bg-[#1E73D8] text-white px-3 py-2 rounded-lg text-lg shadow"
        onClick={() => setSidebarOpen(true)}
      >
        ☰
      </button>

      {/* ✅ OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[2500] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>

        <div className="adm-sidebar-logo">

          {company?.logo?.light ? (
            <img src={company.logo.light} style={{ height: 32 }} />
          ) : (
            <div
              className="navbar-logo-box"
              style={{ width: 32, height: 32, fontSize: 16 }}
            >
              ✕
            </div>
          )}

          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
            {company?.name || "Super App"}
          </span>

          <span className="adm-badge-admin">ADMIN</span>
        </div>

        <nav className="adm-sidenav">

          <button
            className={`adm-nav-btn${tab === "users" ? " active" : ""}`}
            onClick={() => {
              setTab("users");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            All Users
          </button>

          <button
            className={`adm-nav-btn${tab === "stats" ? " active" : ""}`}
            onClick={() => {
              setTab("stats");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Statistics
          </button>

          <button
            className={`adm-nav-btn${tab === "employees" ? " active" : ""}`}
            onClick={() => {
              setTab("employees");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" />
              <path d="M3 21a9 9 0 0118 0" />
            </svg>
            Employees
          </button>

          <button
            className={`adm-nav-btn${tab === "company" ? " active" : ""}`}
            onClick={() => {
              setTab("company");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" />
            </svg>
            Company Settings
          </button>

          <button
  className={`adm-nav-btn${tab === "wallets" ? " active" : ""}`}
  onClick={() => {
    setTab("wallets");
    setSidebarOpen(false);
  }}
>
  💰 Wallets
</button>

          <button
            className={`adm-nav-btn${tab === "swaps" ? " active" : ""}`}
            onClick={() => {
              setTab("swaps");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 16l-4-4 4-4" />
              <path d="M17 8l4 4-4 4" />
              <path d="M3 12h18" />
            </svg>
            Swap Requests
          </button>

          <button
            className={`adm-nav-btn${tab === "marketFees" ? " active" : ""}`}
            onClick={() => {
              setTab("marketFees");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Market Fees
          </button>

          <button
            className={`adm-nav-btn${tab === "credit" ? " active" : ""}`}
            onClick={() => {
              setTab("credit");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            Add Money
          </button>

          <button
            className={`adm-nav-btn${tab === "deposits" ? " active" : ""}`}
            onClick={() => {
              setTab("deposits");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Deposit History
            {pendingCounts.deposits > 0 && (
              <span className="ml-auto adm-pending-badge">{pendingCounts.deposits}</span>
            )}
          </button>

          <button
            className={`adm-nav-btn${tab === "withdrawals" ? " active" : ""}`}
            onClick={() => {
              setTab("withdrawals");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Withdrawals
            {pendingCounts.withdrawals > 0 && (
              <span className="ml-auto adm-pending-badge">{pendingCounts.withdrawals}</span>
            )}
          </button>

          <button
            className={`adm-nav-btn${tab === "staking" ? " active" : ""}`}
            onClick={() => {
              setTab("staking");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Staking Rates
          </button>

          <button
            className={`adm-nav-btn${tab === "pages" ? " active" : ""}`}
            onClick={() => {
              setTab("pages");
              setSidebarOpen(false);
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            Pages
          </button>

        </nav>

        <button
          className="adm-signout-btn"
          onClick={() => {
            localStorage.removeItem("adminAuth");
            localStorage.removeItem("adminToken");
            setAuthed(false);
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>

      </aside>

      {/* Main */}
      <main className="adm-main">
        {tab === "users" && <UsersSection />}
        {tab === "stats" && <StatsSection />}
        {tab === "employees" && <EmployeesSection />}
        {tab === "company" && <CompanySettings />}
        {tab === "pages" && <Pages />}
        {tab === "wallets" && <WalletForm />}
        {tab === "swaps" && <SwapSection />}
        {tab === "marketFees" && <MarketFeesSection />}
        {tab === "deposits" && <DepositsSection />}
        {tab === "credit" && <CreditUserSection />}
        {tab === "withdrawals" && <WithdrawalsSection />}
        {tab === "staking" && <StakingRatesSection />}
      </main>

      {/* ✅ SAME FILE CSS */}
      <style>{`
        .adm-sidenav {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .adm-sidebar {
            position: fixed !important;
            top: 0;
            left: -260px !important;
            height: 100%;
            width: 260px;
            transition: left 0.3s ease;
            z-index: 2000;
          }

          .adm-sidebar.mobile-open {
            left: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}

