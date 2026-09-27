import React from "react";
import { Clock, Users, ShieldCheck } from "lucide-react";

export default function BugBountyPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">

      {/* ===== TOP SECTION ===== */}
      <div className="px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto text-center">

          <h1 className="text-4xl md:text-6xl font-bold mb-6">Bug Bounty</h1>

          <p className="text-gray-400 max-w-3xl mx-auto text-sm md:text-base leading-relaxed mb-8">
            Security is our top priority. The Super App cryptocurrency exchange cares about the security of each user.
            Therefore, we encourage finding vulnerabilities on the exchange and pay rewards for their discovery.
          </p>

          <p className="text-gray-300 font-semibold mb-12">
            To be eligible to receive a reward for finding a vulnerability, you need to:
          </p>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-[#1A1D26] rounded-2xl p-8 text-center">
              <div className="bg-[#2A2E3A] p-4 rounded-xl inline-block mb-6">
                <Clock className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Inform us about the vulnerability</h3>
              <p className="text-gray-400 text-sm">
                Do not disclose information about it and give us sufficient time to fix the vulnerability
              </p>
            </div>

            <div className="bg-[#1A1D26] rounded-2xl p-8 text-center">
              <div className="bg-[#2A2E3A] p-4 rounded-xl inline-block mb-6">
                <Users className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Make the necessary efforts</h3>
              <p className="text-gray-400 text-sm">
                To avoid damage to the exchange and its users.
              </p>
            </div>

            <div className="bg-[#1A1D26] rounded-2xl p-8 text-center">
              <div className="bg-[#2A2E3A] p-4 rounded-xl inline-block mb-6">
                <ShieldCheck className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Do not mislead</h3>
              <p className="text-gray-400 text-sm">
                Users and/or exchange employees during the search and elimination of the vulnerability.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ===== REWARD SECTION (LIGHT) ===== */}
      <div className="bg-[#F3F4F6] text-black py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">

          {/* Left */}
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold mb-4">Reward</h2>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              We do not limit the maximum amount of rewards and can increase the reward depending on the severity of the vulnerability.
              You are more likely to receive an increased reward if you show how the vulnerability can be used to cause maximum harm.
            </p>

            <p className="text-gray-600 text-sm mb-6">
              Here is a list of approximate rewards for finding vulnerabilities:
            </p>

            <div className="space-y-4">
              {[
                ["Remote code execution", "$5000"],
                ["Manipulation of user balances", "$3000"],
                ["XSS/CSRF/Clickjacking affecting actions with user balances/trading/exchange/deposit", "$2000"],
                ["Theft of information related to passwords/API keys/personal information", "$2000"],
                ["Partial authentication bypass", "$1500"],
                ["Other vulnerabilities that can lead to financial losses or data leakage", "$500"],
                ["Other CSRF (except CSRF logout)", "$500"],
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-300 pb-3">
                  <p className="text-gray-700 text-sm max-w-[80%]">{item[0]}</p>
                  <span className="font-semibold text-gray-900">{item[1]}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-500 text-xs mt-6">
              Rewards will NOT be granted for DDoS, Self-XSS, Spam, Social engineering attacks.
            </p>
          </div>

          {/* Right Card */}
          <div className="bg-white rounded-2xl p-6 h-fit border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Have you found a vulnerability?</h3>

            <p className="text-gray-600 text-sm mb-6">
              To report it, send us an email; we will contact you as soon as possible and resolve the issue.
            </p>

            <button className="w-full bg-[#1E6BC8] hover:bg-blue-700 text-white transition rounded-xl py-3 mb-4 font-medium">
              Contact Support
            </button>

            <button className="w-full border border-gray-300 rounded-xl py-3 text-sm text-gray-700 hover:bg-gray-100 transition">
              Send vulnerability to Security
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}