import React from "react";
import { Flame, Coins, ArrowLeft, Info, ChevronRight } from "lucide-react";
import { SITE_NAME } from "../config/site";

const coinPositions = [
  { top: "8%", left: "4%", size: 38, rotate: 12 },
  { top: "0%", left: "18%", size: 28, rotate: -10 },
  { top: "12%", left: "28%", size: 48, rotate: 18 },
  { top: "-2%", left: "38%", size: 24, rotate: 8 },
  { top: "18%", left: "46%", size: 34, rotate: -14 },
  { top: "9%", left: "58%", size: 22, rotate: 16 },
  { top: "30%", left: "8%", size: 26, rotate: 4 },
  { top: "34%", left: "22%", size: 34, rotate: -8 },
  { top: "27%", left: "35%", size: 42, rotate: 10 },
  { top: "21%", left: "66%", size: 30, rotate: -18 },
];

function Coin({ top, left, size, rotate }) {
  return (
    <div
      className="absolute rounded-full bg-gradient-to-br from-[#FFD76A] via-[#F0B033] to-[#D18A0C] shadow-[0_8px_16px_rgba(193,129,26,0.25)] border border-[#C98A1C]/35"
      style={{
        top,
        left,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "inset 0 2px 2px rgba(255,255,255,0.38), inset 0 -3px 8px rgba(140,85,0,0.22), 0 10px 18px rgba(193,129,26,0.18)",
      }}
    >
      <div className="absolute inset-[18%] rounded-full border border-[#e8c26d]/70" />
      <div className="absolute inset-[36%] rounded-full bg-[#f3c04f]/90" />
    </div>
  );
}

function PhoneMockup() {
  const rows = [
    { name: "USDT", rate: "Up to 24.85%" },
    { name: "BTC", rate: "Up to 23.19%" },
    { name: "ETH", rate: "Up to 23.19%" },
    { name: "EOS", rate: "Up to 23.19%" },
  ];

  return (
    <div className="relative mx-auto h-[360px] w-[180px] rounded-[32px] border-[8px] border-black bg-white shadow-[0_22px_50px_rgba(0,0,0,0.16)] overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3 text-[8px] text-black/80">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-3 rounded-full bg-black/80" />
          <span className="h-1.5 w-3 rounded-full border border-black/80" />
          <span className="h-1.5 w-4 rounded-full border border-black/80" />
        </span>
      </div>
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between text-[9px] text-black/70">
          <ArrowLeft className="h-3 w-3" />
          <span className="font-medium">USDT</span>
          <Info className="h-3 w-3" />
        </div>

        <div className="mt-3 rounded-2xl border border-black/10 bg-[#f6f7fb] p-2.5">
          <div className="flex items-center justify-between text-[8px] text-black/55">
            <span>Main balance: 6000.52 USDT</span>
            <span>MAX</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-2 py-1.5 text-[8px] text-black/50 shadow-sm">
            <span>Amount</span>
            <span>0</span>
          </div>
          <div className="mt-2 text-[8px] text-black/45">Min: 5 USDT</div>
          <div className="mt-2 text-[8px] text-black/45">Max: 300 000 USDT</div>
          <div className="mt-3 rounded-xl bg-white px-2 py-1.5 text-[8px] text-black/60 shadow-sm">
            You will earn
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
          <div className="text-[9px] font-medium text-black/70">Choose plan</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="rounded-lg border border-blue-500 bg-blue-50 px-2 py-1 text-[8px] text-blue-600">12 <span className="text-[7px]">d</span><br />0.33%</div>
            <div className="rounded-lg border border-black/10 bg-[#f6f7fb] px-2 py-1 text-[8px] text-black/60">30 <span className="text-[7px]">d</span><br />0.87%</div>
            <div className="rounded-lg border border-black/10 bg-[#f6f7fb] px-2 py-1 text-[8px] text-black/60">60 <span className="text-[7px]">d</span><br />0.97%</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-black/10 bg-white p-2">
        {rows.map((r) => (
          <div key={r.name} className="mb-1 flex items-center justify-between rounded-xl border border-black/10 bg-white px-2 py-1.5 text-[8px] last:mb-0">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-[#e8fbf4] text-[6px] font-bold text-[#1ea97c] flex items-center justify-center">T</div>
              <div>
                <div className="font-semibold leading-none text-black/80">{r.name}</div>
                <div className="leading-none text-black/40">Ethereum</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-black/55">
              <span>{r.rate}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCard({ title, subtitle, icon, button, muted = false }) {
  return (
    <div className="rounded-2xl bg-white/95 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] border border-black/5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4edff] text-[#8d74ff]">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-[#202020]">{title}</h3>
          <p className="mt-1 max-w-[220px] text-[11px] leading-4 text-[#8a8d96]">{subtitle}</p>
        </div>
      </div>
      <button
        className={`mt-5 h-10 w-full rounded-md text-[11px] font-medium ${muted ? "bg-[#d9dce3] text-white" : "bg-[#1f78f0] text-white"}`}
      >
        {button}
      </button>
    </div>
  );
}

export default function CryptoLendingLandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f5f7] text-[#202020]">
      <div className="relative mx-auto max-w-[1440px] px-8 py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,231,206,0.9),transparent_32%),radial-gradient(circle_at_86%_11%,rgba(234,206,255,0.7),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0))]" />

        <div className="relative">
          <header className="max-w-4xl pt-6">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#2a2a2a] sm:text-[32px] lg:text-[38px]">Earn with {SITE_NAME}</h1>
            <p className="mt-2 max-w-[760px] text-[10px] text-[#8a8d96] sm:text-[11px] lg:text-[12px]">
              The {SITE_NAME} family of investment instruments is a great way to generate passive income with a high interest rate
            </p>
          </header>

          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr_1.05fr] lg:gap-5">
            <TopCard
              title="Staking"
              subtitle="Profit daily by keeping your funds in staking-pool without risking your principal"
              icon={<Flame className="h-5 w-5" />}
              button="Choose Plan"
            />
            <TopCard
              title="Crypto Lending"
              subtitle="Lending certain assets to the Exchange at interest rates ranging from 0.3% to 24.85% of revenue"
              icon={<Coins className="h-5 w-5" />}
              button="Soon"
              muted
            />
            <div className="relative hidden lg:block min-h-[170px]">
              <div className="absolute right-0 top-4 h-[180px] w-[330px] rounded-[42px] bg-transparent" />
              {coinPositions.map((c, idx) => (
                <Coin key={idx} {...c} />
              ))}
              <div
                className="absolute right-0 bottom-0 h-[150px] w-[150px] rounded-[55%_45%_55%_45%/50%_50%_50%_50%] bg-gradient-to-br from-[#ffffff] via-[#f3f4f8] to-[#d8dde6] shadow-[0_24px_40px_rgba(0,0,0,0.12)]"
                style={{ transform: "rotate(-12deg)" }}
              >
                <div className="absolute left-[18%] top-[24%] h-[62%] w-[62%] rounded-[50%] bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.9),rgba(255,255,255,0.25)_45%,rgba(216,221,230,0)_70%)]" />
                <div className="absolute left-[24%] top-[34%] h-[12px] w-[75px] rotate-[26deg] rounded-full border-b-[3px] border-[#b87a36]" />
                <div className="absolute left-[58%] top-[31%] h-[26px] w-[26px] rotate-[-18deg] rounded-full border-[2px] border-[#c37b2a] opacity-85" />
                <div className="absolute left-[66%] top-[55%] h-[2px] w-[52px] rotate-[26deg] bg-[#9b6228]" />
                <div className="absolute left-[48%] top-[58%] h-[2px] w-[18px] rotate-[-62deg] bg-[#a86b2d]" />
              </div>
            </div>
          </section>

          <section className="mt-14 rounded-[28px] bg-white p-6 shadow-[0_12px_34px_rgba(0,0,0,0.08)] border border-black/5 lg:mt-16 lg:p-8">
            <div className="grid items-center gap-10 lg:grid-cols-[420px_1fr] lg:gap-16">
              <div className="flex justify-center lg:justify-start">
                <PhoneMockup />
              </div>
              <div className="max-w-[520px]">
                <div className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-[10px] font-medium text-[#4b7dd6]">Easy to use</div>
                <h2 className="mt-3 text-[24px] font-bold tracking-tight text-[#202020] sm:text-[28px]">Staking</h2>
                <p className="mt-4 max-w-[520px] text-[11px] leading-6 text-[#7d818b] sm:text-[12px]">
                  By investing, you participate in various functions of the network in exchange for a reward (fixed or in the form of interest). Your cryptocurrency becomes part of the Proof-of-Stake process, i.e. provides verification and protection of all transactions without the involvement of a bank or payment processor and receives income for this.
                </p>
                <button className="mt-8 h-10 w-[240px] rounded-md bg-[#1f78f0] text-[11px] font-medium text-white shadow-sm">
                  Choose Plan
                </button>
              </div>
            </div>
          </section>

          
        </div>
      </div>
    </div>
  );
}
