import { useLocation, useNavigate } from "react-router-dom";

const items = [
  { label: "Profile", path: "/settings" },
  { label: "Security", path: "/security" },
  { label: "Identity Verification", path: "/kyc" },
  { label: "Referral Program", path: "/referral" },
  { label: "API Management", path: "/api-management" },
  { label: "Mobile App", path: "/mobile-app" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-[240px] bg-white border-r min-h-screen">
      <div className="p-4 font-semibold text-gray-800 border-b">
        Account Settings
      </div>

      <div className="space-y-1 p-2 text-sm">
        {items.map((item) => (
          <div
            key={item.path}
            className={`p-2 rounded cursor-pointer transition-colors ${
              location.pathname === item.path
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}