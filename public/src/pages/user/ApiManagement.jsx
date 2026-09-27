import { useState } from "react";
import Sidebar from "./components/Sidebar";

export default function ApiManagement() {
  const [apiKeys] = useState([]);

  return (
    <div className="flex bg-[#f5f6f8] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">API Management</h2>
              <p className="text-sm text-gray-400 mt-0.5">Create and manage API keys for automated trading</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              + Create API Key
            </button>
          </div>

          <div className="mb-6">
            <div className="flex gap-4 border-b pb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" /> Read
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" /> Trade
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" /> Withdraw
              </label>
            </div>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-gray-400 text-sm">No API keys created yet</p>
              <p className="text-gray-400 text-xs mt-1">Create an API key to start automated trading</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-400">
                    <th className="py-3 px-2">Label</th>
                    <th className="py-3 px-2">API Key</th>
                    <th className="py-3 px-2">Permissions</th>
                    <th className="py-3 px-2">Created</th>
                    <th className="py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="border-b">
                      <td className="py-3 px-2">{key.label}</td>
                      <td className="py-3 px-2 font-mono text-xs">{key.apiKey}</td>
                      <td className="py-3 px-2">{key.permissions}</td>
                      <td className="py-3 px-2">{key.createdAt}</td>
                      <td className="py-3 px-2">
                        <button className="text-red-500 hover:text-red-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800">Security Warning</h3>
            <p className="text-xs text-yellow-700 mt-1">
              Never share your API keys with anyone. Store them securely. We recommend using IP whitelisting and only enabling the permissions you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}