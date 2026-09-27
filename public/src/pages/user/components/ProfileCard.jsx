import { useAuth } from "../../../context/AuthContext";

export default function ProfileCard() {
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Account Info</h2>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{user?.name || user?.email?.split("@")[0]}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">UID {user?.uid?.slice(0, 12) || "—"}</div>
          </div>
        </div>

        <div className="bg-[#fff1ec] p-4 rounded-lg text-sm text-red-500">
          Your account security level is Low.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mt-6 text-sm">
        <div>
          <div className="text-gray-400">Last login</div>
          <div>Today</div>
        </div>
        <div>
          <div className="text-gray-400">Status</div>
          <div className="text-green-600 font-medium">Verified</div>
        </div>
        <div>
          <div className="text-gray-400">VIP</div>
          <div className="text-yellow-600 font-medium">Level 1</div>
        </div>
        <div>
          <div className="text-gray-400">Security</div>
          <div className="text-orange-500">Medium</div>
        </div>
      </div>
    </div>
  );
}