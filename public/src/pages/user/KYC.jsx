import Sidebar from "./components/Sidebar";

const steps = [
  { label: "Personal Information", status: "pending", desc: "Full name, date of birth, nationality" },
  { label: "Identity Document", status: "pending", desc: "Passport, Driver's License or ID Card" },
  { label: "Proof of Address", status: "pending", desc: "Utility bill or bank statement (last 3 months)" },
  { label: "Selfie Verification", status: "pending", desc: "Take a selfie holding your ID document" },
];

export default function KYC() {
  return (
    <div className="flex bg-[#f5f6f8] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Identity Verification (KYC)</h2>
          <p className="text-sm text-gray-400 mb-6">
            Verify your identity to unlock higher limits and full platform features
          </p>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">unverified</div>
              <div className="text-xs text-gray-500 mt-1">Current Level</div>
            </div>
            <div className="flex-1 bg-gray-50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-400">$100K</div>
              <div className="text-xs text-gray-500 mt-1">Daily Deposit Limit</div>
            </div>
            <div className="flex-1 bg-gray-50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-400">$50K</div>
              <div className="text-xs text-gray-500 mt-1">Daily Withdrawal Limit</div>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === "done" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {step.status === "done" ? "✓" : i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{step.label}</div>
                  <div className="text-xs text-gray-400">{step.desc}</div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}