import Sidebar from "./components/Sidebar";
import ProfileCard from "./components/ProfileCard";
import SettingItem from "./components/SettingItem";

export default function AccountSettings() {
  return (
    <div className="flex bg-[#f5f6f8] min-h-screen">

      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT CONTENT */}
      <div className="flex-1 p-8">

        {/* PROFILE */}
        <ProfileCard />

        {/* SETTINGS */}
        <div className="mt-6 space-y-4">

          <SettingItem 
            title="Profile Picture" 
            desc="Please upload a profile picture"
            btn="Upload" 
          />

          <SettingItem 
            title="Identity Verification" 
            desc="Complete KYC verification to unlock new opportunities"
            btn="Verify Now" 
          />

          <SettingItem 
            title="Google Two Factor Authentication" 
            desc="Additional protection when logging into an account"
            btn="Settings" 
          />

          <SettingItem 
            title="Anti-Phishing Code" 
            desc="All of our official emails will contain anti-phishing code"
            btn="Settings" 
          />

        </div>

      </div>
    </div>
  );
}