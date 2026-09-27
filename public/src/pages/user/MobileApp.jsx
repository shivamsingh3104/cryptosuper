import Sidebar from "./components/Sidebar";

export default function MobileApp() {
  return (
    <div className="flex bg-[#f5f6f8] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Mobile App</h2>
          <p className="text-sm text-gray-400 mb-6">Trade anywhere with our mobile app</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border rounded-lg p-6 text-center hover:shadow-md transition">
              <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
              <h3 className="font-semibold">iOS App</h3>
              <p className="text-xs text-gray-400 mt-1">Download from App Store</p>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Download
              </button>
            </div>

            <div className="border rounded-lg p-6 text-center hover:shadow-md transition">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
              </div>
              <h3 className="font-semibold">Android App</h3>
              <p className="text-xs text-gray-400 mt-1">Download from Google Play</p>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Download
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-3">App Features</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                "Real-time market data",
                "Advanced charting tools",
                "One-click trading",
                "Biometric login",
                "Price alerts",
                "Portfolio tracking",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}