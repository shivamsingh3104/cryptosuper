import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Spot from "./pages/Spot";
import Swap from "./pages/Swap";
import About from "./pages/About";
import Overview from "./pages/Overview";
import MarketCap from "./pages/MarketCap";
import MarketScreener from "./pages/MarketScreener";
import CrossRates from "./pages/CrossRates";
import CurrencyHeatMap from "./pages/CurrencyHeatMap";
import TechnicalAnalysis from "./pages/TechnicalAnalysis";
import AssetsPage from "./pages/AssetsPage";
import Staking from "./pages/Staking";
import Cryptolending from "./pages/Cryptolending";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DynamicPage from "./pages/DynamicPage";
import Tournament from "./pages/Tournament";
import Verify from "./pages/footer/Verify";
import Bug from "./pages/footer/Bug";
import Fees from "./pages/footer/Fees";
import Corporate from "./pages/footer/Corporate";
import Institutional from "./pages/footer/Institutional";
import Token from "./pages/footer/Token";
import Profile from "./pages/user/Profile";
import WalletPage from "./pages/WalletPage";
import HistoryPage from "./pages/HistoryPage";

import AccountSettings from "./pages/user/AccountSettings";
import Security from "./pages/user/Security";
import KYC from "./pages/user/KYC";
import Referral from "./pages/user/Referral";
import ApiManagement from "./pages/user/ApiManagement";
import MobileApp from "./pages/user/MobileApp";



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin — NO Navbar/Footer */}
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* All public routes WITH Navbar + Footer */}
          <Route path="/*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/"                    element={<Home />} />
                <Route path="/markets"             element={<Markets />} />
                <Route path="/login"               element={<Login />} />
                <Route path="/signup"              element={<Signup />} />
                <Route path="/spot"                element={<Spot />} />
                <Route path="/swap"                element={<Swap />} />
                <Route path="/tournament"          element={<Tournament />} />
                <Route path="/about"               element={<About />} />
                <Route path="/overview"            element={<Overview />} />
                <Route path="/verify"              element={<Verify />} />
                <Route path="/bug-bounty"          element={<Bug />} />
                <Route path="/corporate-identity"          element={<Corporate />} />
                <Route path="/institutional-services"      element={<Institutional />} />
                <Route path="/token-listing"       element={<Token />} />
                <Route path="/fees"                element={<Fees />} />
                <Route path="/tools/market-cap"    element={<MarketCap />} />
                <Route path="/tools/screener"      element={<MarketScreener />} />
                <Route path="/tools/cross-rates"   element={<CrossRates />} />
                <Route path="/tools/heatmap"       element={<CurrencyHeatMap />} />
                <Route path="/tools/technical"     element={<TechnicalAnalysis />} />
                <Route path="/assets"              element={<AssetsPage />} />
                <Route path="/earn/staking"        element={<Staking />} />
                <Route path="/earn/crypto-lending" element={<Cryptolending />} />
                <Route path="/dashboard"           element={<UserDashboard />} />
                <Route path="/page/:slug" element={<DynamicPage />} />
                <Route path="/profile" element={<Profile />} />
                {/* Deposit flow hata diya — admin hi wallet me credit karta hai. */}
                <Route path="/profile/wallet" element={<WalletPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/history/deposits" element={<HistoryPage />} />
                <Route path="/history/withdrawals" element={<HistoryPage />} />
                <Route path="/history/transfers" element={<HistoryPage />} />
                <Route path="/history/earnings" element={<HistoryPage />} />

                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/security" element={<Security />} />
                <Route path="/kyc" element={<KYC />} />
                <Route path="/referral" element={<Referral />} />
                <Route path="/api-management" element={<ApiManagement />} />
                <Route path="/mobile-app" element={<MobileApp />} />


              </Routes>
              <Footer />
            </>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
