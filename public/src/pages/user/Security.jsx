import Sidebar from "./components/Sidebar";

export default function Security() {
  return (
    <div className="flex bg-[#f5f6f8] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Security Settings</h2>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-semibold">Login Password</div>
                <div className="text-sm text-gray-400 mt-0.5">Last changed: 30 days ago</div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Change</button>
            </div>

            <div className="bg-white p-5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-semibold">Fund Password</div>
                <div className="text-sm text-gray-400 mt-0.5">Used for withdrawals and transfers</div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Set</button>
            </div>

            <div className="bg-white p-5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-semibold">Google Two-Factor Authentication</div>
                <div className="text-sm text-gray-400 mt-0.5">Protect your account with 2FA</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-orange-500 font-medium">Disabled</span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Enable</button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-semibold">Anti-Phishing Code</div>
                <div className="text-sm text-gray-400 mt-0.5">All official emails will contain this code</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Not Set</span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Set Code</button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-semibold">Device Management</div>
                <div className="text-sm text-gray-400 mt-0.5">Manage trusted devices and sessions</div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Manage</button>
            </div>

            <div className="bg-white p-5 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-semibold text-red-600">Delete Account</div>
                <div className="text-sm text-gray-400 mt-0.5">Permanently delete your account and all data</div>
              </div>
              <button className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-100 border border-red-200">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}