import { useAuth } from "../../context/AuthContext";
import Sidebar from "./components/Sidebar";

export default function Referral() {
  const { user } = useAuth();
  const referralLink = user?.uid
    ? `${window.location.origin}/signup?ref=${user.uid}`
    : "Login to get your referral link";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied!");
  };

  return (
    <div className="flex bg-[#f5f6f8] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Referral Program</h2>
          <p className="text-sm text-gray-400 mb-6">
            Invite friends and earn rewards on their trading fees
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-lg">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm opacity-80 mt-1">Total Referrals</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-5 rounded-lg">
              <div className="text-2xl font-bold">$0.00</div>
              <div className="text-sm opacity-80 mt-1">Total Rewards</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-5 rounded-lg">
              <div className="text-2xl font-bold">30%</div>
              <div className="text-sm opacity-80 mt-1">Commission Rate</div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Referral Link</label>
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 border rounded-lg text-sm bg-gray-50 font-mono"
                value={referralLink}
                readOnly
              />
              <button
                onClick={copyLink}
                className="bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-sm mb-2">How it works</h3>
            <ul className="text-sm text-gray-500 space-y-1.5">
              <li>1. Share your referral link with friends</li>
              <li>2. They sign up and start trading</li>
              <li>3. Earn 30% of their trading fees for life</li>
              <li>4. Withdraw your rewards anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}