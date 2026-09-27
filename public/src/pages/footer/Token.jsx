import React from "react";
import {
    GlobeAltIcon,
    ShieldCheckIcon,
    UserIcon,
    CreditCardIcon,
} from "@heroicons/react/24/outline";

export default function Page() {
    return (
        <div className="w-full">

            {/* ================= HERO ================= */}
            <section className="relative w-full h-[520px] overflow-hidden bg-[#05070c] text-white">

                <div className="absolute left-0 top-0 w-[400px] h-full bg-gradient-to-r from-[#ff7a00]/20 to-transparent blur-2xl" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:40px_40px]" />
                <div className="absolute right-[120px] top-[40px] w-[140px] h-[140px] rounded-full bg-[#6b6f7c] opacity-80 shadow-inner" />

                <div className="absolute bottom-0 left-0 right-0 h-[200px]">
                    <div className="absolute bottom-0 w-full h-full border-t border-gray-700 rounded-[50%]" />
                    <div className="absolute bottom-[-40px] w-full h-full border-t border-gray-800 rounded-[50%]" />
                </div>

                <div className="absolute top-[120px] left-[45%] w-12 h-12 bg-yellow-400 rounded-full shadow-lg" />
                <div className="absolute top-[200px] left-[35%] w-8 h-8 bg-yellow-300 rounded-full" />
                <div className="absolute top-[180px] right-[25%] w-6 h-6 bg-yellow-300 rounded-full" />
                <div className="absolute top-[220px] right-[15%] w-10 h-10 bg-yellow-400 rounded-full" />

                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24">
                    <h1 className="text-5xl font-bold leading-tight">
                        To the moon <br /> with Super App
                    </h1>

                    <p className="text-gray-400 mt-6 text-lg max-w-md">
                        Increase your trading volume to 1 million USD with our Trading Tournament
                    </p>

                    <button className="mt-8 bg-[#1E73D8] hover:bg-blue-600 px-6 py-3 rounded-lg text-lg">
                        Participate
                    </button>
                </div>
            </section>

            {/* ================= WHY SECTION ================= */}
            <section className="bg-[#F4F6F9] py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">

                    <h2 className="text-3xl md:text-4xl font-bold text-[#0B0F1A]">
                        Why will your project skyrocket?
                    </h2>

                    <p className="mt-4 text-[#6B7280] text-base md:text-lg">
                        You will receive the most comprehensive solution on the market to help you grow.
                    </p>

                    <div className="grid md:grid-cols-4 gap-10 mt-16">

                        {/* cards same as before */}

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-[#EDEFF3] flex items-center justify-center">
                                <GlobeAltIcon className="w-8 h-8 text-[#9CA3AF]" />
                            </div>
                            <h3 className="mt-6 font-semibold text-lg text-[#111827]">
                                3 million users
                            </h3>
                            <p className="mt-3 text-sm text-[#6B7280] max-w-xs">
                                Currently, more than 3 million users from over 150 countries are registered on our exchange.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-[#EDEFF3] flex items-center justify-center">
                                <ShieldCheckIcon className="w-8 h-8 text-[#9CA3AF]" />
                            </div>
                            <h3 className="mt-6 font-semibold text-lg text-[#111827]">
                                Friendly identity verification policy
                            </h3>
                            <p className="mt-3 text-sm text-[#6B7280] max-w-xs">
                                Users can trade and withdraw funds in any digital asset.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-[#EDEFF3] flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-[#9CA3AF]" />
                            </div>
                            <h3 className="mt-6 font-semibold text-lg text-[#111827]">
                                Personal manager
                            </h3>
                            <p className="mt-3 text-sm text-[#6B7280] max-w-xs">
                                Available 24/7 to answer all your questions.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-[#EDEFF3] flex items-center justify-center">
                                <CreditCardIcon className="w-8 h-8 text-[#9CA3AF]" />
                            </div>
                            <h3 className="mt-6 font-semibold text-lg text-[#111827]">
                                Fiat gateway
                            </h3>
                            <p className="mt-3 text-sm text-[#6B7280] max-w-xs">
                                Withdraw fiat currency to Visa and Mastercard.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ================= COVERAGE SECTION ================= */}
            <section className="relative bg-[#F4F6F9] py-24 px-6 overflow-hidden">

                {/* CIRCLES */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[900px] h-[900px] border border-gray-200 rounded-full opacity-50"></div>
                    <div className="absolute w-[700px] h-[700px] border border-gray-200 rounded-full opacity-50"></div>
                    <div className="absolute w-[500px] h-[500px] border border-gray-200 rounded-full opacity-50"></div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto text-center">

                    <h2 className="text-4xl font-bold mb-12">Coverage</h2>

                    {/* REAL SVG MAP */}
                    <div className="w-full flex justify-center">
                        <svg viewBox="0 0 1000 500" className="w-full max-w-4xl">

                            {/* ALL CONTINENTS (DEFAULT GREY) */}
                            <g className="continent">
                                <path d="M100 120L300 100L350 180L250 260L120 220Z" />
                                <path d="M520 120L700 100L820 180L780 260L600 240L520 180Z" />
                                <path d="M600 260L660 350L600 420L520 350L550 260Z" />
                                <path d="M400 280L450 360L420 450L360 380Z" />
                                <path d="M780 360L860 340L900 400L820 420Z" />
                            </g>

                            {/* ACTIVE REGIONS (blue default) */}
                            <g className="active-region">
                                <path d="M100 120L300 100L350 180L250 260L120 220Z" />
                                <path d="M780 360L860 340L900 400L820 420Z" />
                            </g>

                        </svg>
                    </div>

                    {/* BOXES */}
                    <div className="flex flex-wrap justify-center gap-4 mt-12">
                        {[
                            ["Europe and CIS", "56%"],
                            ["Asia", "23%"],
                            ["South America", "17%"],
                            ["Africa", "3%"],
                            ["Other", "1%"],
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="min-w-[180px] px-6 py-4 border border-gray-300 rounded-xl bg-white"
                            >
                                <p className="text-gray-500 text-sm">{item[0]}</p>
                                <p className="font-bold text-lg">{item[1]}</p>
                            </div>
                        ))}
                    </div>

                </div>

                {/* CSS (IMPORTANT) */}
                <style jsx>{`
    .continent path {
      fill: #d1d5db;
      transition: 0.3s;
    }

    .active-region path {
      fill: #1e73d8;
      transition: 0.3s;
      cursor: pointer;
    }

    .active-region path:hover {
      fill: #0f4fbf;
    }
  `}</style>
            </section>

            {/* ==========listing=========== */}
            <section className="fast-listing-section text-center text-white py-24 px-6 relative overflow-hidden">

                {/* STARS */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:40px_40px]" />

                <div className="relative z-10 max-w-4xl mx-auto">

                    <h2 className="text-4xl md:text-5xl font-bold">
                        Fast listing in{" "}
                        <span className="text-gradient">48 hours</span>
                    </h2>

                    <p className="mt-4 text-gray-300 text-lg">
                        We can list your project on our exchange within 48 hours
                    </p>

                    <button className="mt-8 bg-[#1E73D8] hover:bg-blue-600 px-8 py-3 rounded-lg text-lg font-medium">
                        Fast listing
                    </button>

                </div>

                {/* GRADIENT BLOBS */}
                <div className="blob blob-left"></div>
                <div className="blob blob-right"></div>

                {/* CUSTOM CSS */}
                <style jsx>{`
    .fast-listing-section {
      background: radial-gradient(circle at 20% 80%, #ff7a00 0%, transparent 40%),
                  radial-gradient(circle at 80% 20%, #a855f7 0%, transparent 40%),
                  #05070c;
    }

    .text-gradient {
      background: linear-gradient(90deg, #ffb86c, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .blob {
      position: absolute;
      width: 400px;
      height: 400px;
      filter: blur(120px);
      opacity: 0.4;
      border-radius: 50%;
    }

    .blob-left {
      background: #ff7a00;
      bottom: -100px;
      left: -100px;
    }

    .blob-right {
      background: #a855f7;
      top: -100px;
      right: -100px;
    }
  `}</style>
            </section>





            {/* ========== listing experience ========= */}

            <section className="bg-[#F4F6F9] py-20 px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Heading */}
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
                        Have you ever had an unsuccessful listing experience?
                    </h2>

                    {/* ITEMS */}
                    <div className="space-y-6">

                        {[
                            {
                                left: "We earned nothing",
                                right:
                                    "We conduct a marketing audit before listing, analyze your marketing strategy, and develop an improvement plan to achieve the best results.",
                            },
                            {
                                left: "No trading occurred",
                                right:
                                    "Our large community from various countries will give your asset the opportunity to grow.",
                            },
                            {
                                left: "No users",
                                right:
                                    "We always attract new users through our activities and events.",
                            },
                            {
                                left: "Service was poor",
                                right:
                                    "Our managers are ready to assist you with any question or issue when you need it.",
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex flex-col md:flex-row items-stretch bg-white rounded-2xl overflow-hidden shadow-sm"
                            >

                                {/* LEFT SIDE */}
                                <div className="flex items-center gap-3 px-6 py-6 md:w-1/3 bg-[#EEF1F5] relative left-box">
                                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm">
                                        ✕
                                    </div>
                                    <p className="text-gray-600 text-base font-medium">
                                        {item.left}
                                    </p>
                                </div>

                                {/* RIGHT SIDE */}
                                <div className="flex items-center gap-3 px-6 py-6 md:w-2/3">
                                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white text-sm">
                                        ✓
                                    </div>
                                    <p className="text-gray-700 text-base">
                                        {item.right}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* SMALL CUSTOM CSS (ONLY FOR ARROW SHAPE) */}
                <style jsx>{`
    .left-box {
      clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%);
    }
  `}</style>
            </section>




            {/* ======= Fast listing========= */}

            <section className="relative bg-[#F4F6F9] py-24 px-6 overflow-hidden">

                {/* BACKGROUND CIRCLES */}
                <div className="bg-circle circle-left"></div>
                <div className="bg-circle circle-right"></div>

                <div className="relative z-10 max-w-xl mx-auto text-center">

                    {/* Heading */}
                    <h2 className="text-4xl md:text-5xl font-bold text-black">
                        Fast listing in 48 hours
                    </h2>

                    <p className="mt-4 text-gray-500 text-lg">
                        We can list your project on our exchange within 48 hours
                    </p>

                    {/* FORM */}
                    <div className="mt-10 space-y-5">

                        {[
                            "Project name",
                            "Project website",
                            "Contact email",
                            "Position",
                            "Personal Telegram or WhatsApp",
                        ].map((placeholder, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={placeholder}
                                className="w-full h-14 px-5 rounded-xl border border-gray-300 bg-[#F1F3F6] text-gray-700 placeholder-gray-500 outline-none focus:border-blue-500"
                            />
                        ))}

                        <button className="w-full h-14 mt-4 bg-[#1E73D8] text-white font-medium rounded-xl hover:bg-blue-600 transition">
                            Send
                        </button>

                    </div>
                </div>

                {/* CUSTOM CSS (FOR BACKGROUND SHAPES) */}
                <style jsx>{`
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%);
      filter: blur(2px);
    }

    .circle-left {
      width: 500px;
      height: 500px;
      left: -150px;
      bottom: -150px;
    }

    .circle-right {
      width: 500px;
      height: 500px;
      right: -150px;
      top: -150px;
    }
  `}</style>
            </section>





        </div>
    );
}