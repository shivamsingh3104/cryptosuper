import React from "react";
import { Users, BarChart3, MapPin, BriefcaseBusiness, Wallet, Globe, Lock, Bug, ShieldCheck, BadgeCheck } from "lucide-react";
import { SITE_NAME } from "../../config/site";

function DotMap({ className = "", style = {} }) {
  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(121,124,190,0.85) 1.1px, transparent 1.2px)",
        backgroundSize: "7px 7px",
        ...style,
      }}
    />
  );
}

function HeroBadge({ className = "", label, flag }) {
  return (
    <div className={`absolute ${className} bg-white text-[#222] text-xs rounded-md px-2 py-1 shadow-sm flex items-center gap-1`}>
      <span>{flag}</span>
      <span>{label}</span>
    </div>
  );
}

export default function InstitutionalServices() {
  const services = [
    {
      title: "Market Makers",
      desc: "Utilize an additional liquidity pool, diversify risks, and trade on more favorable terms.",
      Icon: BarChart3,
    },
    {
      title: "Asset Management",
      desc: "Automate and accelerate the reception, exchange, and withdrawal of over 270 digital assets.",
      Icon: BriefcaseBusiness,
    },
    {
      title: "Crypto Wallets",
      desc: "Expand your cryptocurrency assortment and generate an unlimited number of wallet addresses.",
      Icon: Wallet,
    },
    {
      title: "Exchanges",
      desc: "Increase the number of trading instruments and pairs using our API and liquidity.",
      Icon: Globe,
    },
    {
      title: "Funds or Private Investors",
      desc: "Hedge risks by investing in CryptoDeposit plans with returns up to 24.85% annually.",
      Icon: Users,
    },
    {
      title: "Cryptocurrencies",
      desc: "Get fast listing, promotion, and comprehensive support to help your project grow.",
      Icon: BadgeCheck,
    },
  ];

  const secureItems = [
    {
      Icon: Lock,
      bg: "bg-sky-100",
      iconClass: "text-sky-500",
      text: "We store 96% of digital assets in cold wallets",
    },
    {
      Icon: Bug,
      bg: "bg-rose-100",
      iconClass: "text-rose-500",
      text: "We use WAF to detect and block hacker attacks",
    },
    {
      Icon: ShieldCheck,
      bg: "bg-emerald-100",
      iconClass: "text-emerald-500",
      text: "We comply with GDPR European data protection standards",
    },
    {
      Icon: BadgeCheck,
      bg: "bg-amber-100",
      iconClass: "text-amber-500",
      text: "We are certified in confidential information management",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#faf8fb] via-[#fff7f8] to-[#f1eef6] text-[#111]">
        {/* subtle background tint */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,220,227,0.35),transparent_45%)]" />

        {/* Left map clusters */}
        <DotMap className="left-0 top-0 w-[46%] h-[56%] opacity-55" style={{ clipPath: "polygon(0 0, 80% 0, 86% 12%, 84% 22%, 76% 28%, 74% 40%, 62% 42%, 58% 34%, 49% 30%, 38% 36%, 30% 28%, 22% 30%, 15% 24%, 10% 14%, 0 10%)" }} />
        <DotMap className="left-[-2%] top-[38%] w-[23%] h-[28%] opacity-45" style={{ clipPath: "polygon(20% 0, 55% 0, 70% 12%, 78% 26%, 68% 44%, 60% 60%, 58% 80%, 42% 100%, 22% 94%, 14% 74%, 12% 54%, 6% 34%)" }} />

        {/* Right map clusters */}
        <DotMap className="right-0 top-0 w-[44%] h-[60%] opacity-55" style={{ clipPath: "polygon(18% 4%, 36% 0, 50% 8%, 64% 4%, 78% 10%, 88% 18%, 96% 30%, 92% 44%, 86% 56%, 76% 60%, 70% 76%, 60% 86%, 46% 92%, 34% 84%, 22% 74%, 12% 60%, 8% 42%, 10% 24%)" }} />
        <DotMap className="right-[1%] top-[32%] w-[18%] h-[34%] opacity-45" style={{ clipPath: "polygon(36% 0, 56% 4%, 68% 16%, 72% 34%, 64% 48%, 58% 66%, 48% 82%, 34% 100%, 22% 88%, 18% 68%, 20% 46%, 26% 26%)" }} />

        {/* Badges */}
        <HeroBadge className="left-4 bottom-[24%] md:left-6 md:bottom-[26%]" label="Australia" flag="🇦🇺" />
        <HeroBadge className="right-[21%] top-[11%]" label="United Kingdom" flag="🇬🇧" />
        <HeroBadge className="right-[12%] top-[21%]" label="Turkey" flag="🇹🇷" />

        <div className="relative z-10 px-6 md:px-12 pt-10 pb-14 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="inline-block text-[12px] md:text-sm text-blue-500 bg-white/70 px-3 py-1 rounded-full shadow-sm mb-3">
              For partners
            </p>

            <h1 className="text-4xl md:text-5xl font-extrabold text-[#111] leading-tight">
              Institutional
              <br />
              Services {SITE_NAME}
            </h1>

            <p className="mt-4 text-[13px] md:text-sm text-[#6a6f7c] leading-relaxed">
              A full range of solutions for corporate clients
              <br />
              From providing liquidity to customized terms for traders
            </p>

            <button className="mt-6 bg-[#1178EE] hover:bg-[#0f6ddd] text-white text-sm font-medium px-5 py-3 rounded-lg shadow-sm">
              Let’s start cooperation!
            </button>
          </div>

          {/* stats card overlapping hero */}
          <div className="max-w-5xl mx-auto mt-10 md:mt-12 bg-white text-[#111] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="py-7 px-6 flex flex-col items-center justify-center text-center gap-2">
                <Users className="w-5 h-5 text-[#111]" />
                <p className="text-lg font-medium">500+</p>
                <p className="text-sm text-gray-500">institutional clients</p>
              </div>
              <div className="py-7 px-6 flex flex-col items-center justify-center text-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#111]" />
                <p className="text-lg font-medium">equivalent of $700 million</p>
                <p className="text-sm text-gray-500">average daily trading volume</p>
              </div>
              <div className="py-7 px-6 flex flex-col items-center justify-center text-center gap-2">
                <MapPin className="w-5 h-5 text-[#111]" />
                <p className="text-lg font-medium">8 offices across three continents</p>
                <p className="text-sm text-gray-500">&nbsp;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DARK BUSINESS SECTION */}
      <section className="bg-[#0B0D14] px-6 md:px-12 pt-14 pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Strengthen your business with {SITE_NAME}
          </h2>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl mx-auto">
            We provide advanced solutions and personalized support to all types of institutional clients
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-4 md:gap-6 text-left">
            {services.map(({ title, desc, Icon }, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#1A1D26] border border-[#242837] p-5 min-h-[145px] shadow-sm"
              >
                <Icon className="w-5 h-5 text-white/70 mb-3" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHT SECURE CONDITIONS */}
      <section className="bg-[#F6F7FA] text-[#111] px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Stable and Secure Conditions</h2>
          <p className="mt-3 text-sm text-gray-500 max-w-2xl mx-auto">
            Reliability and security of your assets are assured by regular audits and certifications in compliance
            with global security standards.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {secureItems.map(({ Icon, bg, iconClass, text }, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-md ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconClass}`} />
                </div>
                <p className="text-xs text-gray-500 leading-snug max-w-[210px]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="bg-[#0B0D14] text-white px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Take a Step Towards Cooperation</h2>
          <p className="mt-2 text-xs md:text-sm text-gray-500">
            Leave your contact information to start an effective and transparent partnership with {SITE_NAME}
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Your Name*",
              "Company Name",
              "Personal Telegram or WhatsApp*",
              "Company Website",
              "E-mail*",
              "What are you interested in?",
            ].map((placeholder, idx) => (
              <input
                key={idx}
                placeholder={placeholder}
                className="w-full h-11 rounded-md bg-black border border-[#222634] px-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#1178EE]"
              />
            ))}
          </div>

          <button className="mt-6 w-full h-11 rounded-md bg-[#1178EE] hover:bg-[#0f6ddd] text-sm font-medium text-white">
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
