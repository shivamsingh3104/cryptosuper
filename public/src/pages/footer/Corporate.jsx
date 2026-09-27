import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function CorporateIdentity() {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* ===== HERO ===== */}
      <div className="bg-gradient-to-b from-[#121629] to-[#1A1D26] text-white text-center px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Corporate Identity
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
          On this page, we present guidelines for using brand materials. It is important for us to maintain the
          integrity of the product perception
        </p>

        {/* Top Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">

          <div className="bg-white text-black rounded-2xl p-6 text-center shadow-sm">
            <div className="bg-gray-100 p-4 rounded-xl inline-block mb-4">X</div>
            <h3 className="font-semibold mb-1">Logo</h3>
            <p className="text-sm text-gray-500">
              Logos are available in PNG and SVG formats in the archive; rules for their use are below
            </p>
          </div>

          <div className="bg-white text-black rounded-2xl p-6 text-center shadow-sm">
            <div className="bg-gray-100 p-4 rounded-xl inline-block mb-4">F</div>
            <h3 className="font-semibold mb-1">Font</h3>
            <p className="text-sm text-gray-500">
              Use Intera for headings and Inter for body text
            </p>
          </div>

          <div className="bg-white text-black rounded-2xl p-6 text-center shadow-sm">
            <div className="bg-gray-100 p-4 rounded-xl inline-block mb-4">▦</div>
            <h3 className="font-semibold mb-1">Materials</h3>
            <p className="text-sm text-gray-500">
              If you lack materials for your purposes, write to us and we will provide them
            </p>
          </div>

        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-6 py-16">

        <div className="grid md:grid-cols-3 gap-10">

          {/* LEFT */}
          <div>
            <span className="text-xs bg-orange-100 text-orange-500 px-2 py-1 rounded-full">
              Please note
            </span>

            <h2 className="text-2xl font-bold mt-4 mb-3">Naming</h2>

            <p className="text-gray-500 text-sm">
              Correct spelling of our brand is very important to us, as it affects how we are perceived as a company in the information space
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-3">Brand Usage Rules</h2>

            <p className="text-gray-500 text-sm">
              Materials on this page are the property of the company. Do not copy the brand's visual style and do not use a similar style to avoid misleading consumers
            </p>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-2 space-y-6">

            {/* Correct */}
            <div className="bg-white rounded-xl p-5 flex items-start gap-4">
              <CheckCircle className="text-green-500" />
              <div>
                <p className="font-semibold">Super App</p>
                <p className="text-sm text-gray-500">
                  When writing the name, you cannot change the case and must use a capital "S"
                </p>
              </div>
            </div>

            {/* Wrong row */}
            <div className="grid md:grid-cols-3 gap-4">

              {[
                ["SuperApp!", "Do not add any characters to the spelling of the name"],
                ["SUPER APP", "Do not change the number of capital letters"],
                ["super app", "Do not use only lowercase letters"],
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 flex gap-3">
                  <XCircle className="text-red-500" />
                  <div>
                    <p className="font-semibold">{item[0]}</p>
                    <p className="text-sm text-gray-500">{item[1]}</p>
                  </div>
                </div>
              ))}

            </div>

            {/* Rules */}
            {[
              "Do not combine the Super App logo with other images without the consent of a company representative",
              "Do not alter the Super App logo and always use it on a dark background for good readability",
              "Do not use the Super App brand implying relationships with other brands, affiliation, or endorsement",
              "Do not use the Super App brand in conjunction with any illegal activity, advertisement, or product",
            ].map((rule, i) => (
              <div key={i} className="bg-white rounded-xl p-5 flex gap-3">
                <XCircle className="text-red-500" />
                <p className="text-sm text-gray-600">{rule}</p>
              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}
