export default function SettingItem({ title, desc, btn }) {
  return (
    <div className="bg-white p-5 rounded-lg flex items-center justify-between shadow-sm">

      {/* LEFT */}
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-400">{desc}</div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        <span className="text-gray-400 text-sm">Not Configured</span>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
          {btn}
        </button>

      </div>
    </div>
  );
}