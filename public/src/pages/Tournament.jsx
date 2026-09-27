import React, { useState } from 'react';
import { GlobeAltIcon, ChevronDownIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const Verify = () => {
  const channelTypes = [
    { id: 'website', name: 'Website', icon: GlobeAltIcon, placeholder: 'https://superapp.com' },
    { id: 'email', name: 'Email Address', icon: EnvelopeIcon, placeholder: 'support@superapp.com' },
    { id: 'social', name: 'Social Media', icon: GlobeAltIcon, placeholder: '@superapp_official' },
  ];

  const [selectedType, setSelectedType] = useState(channelTypes[0]);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-[50vh] bg-[#F6F7F9] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl text-center">

        {/* Top Notice */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <p className="text-xs text-gray-500">Make sure you are on the official website</p>
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-gray-600">
            <LockClosedIcon className="w-4 h-4" />
            <span className="text-xs font-medium">https://superapp.com</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug mb-4">
          Verification of Super App<br />communication channels
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          To prevent fraud, we have created a page to verify Super App channels and business accounts.
          Below you can check all official communication channels: social media groups, websites, email
          addresses, and business accounts.
        </p>

        {/* Form Row */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-center max-w-2xl mx-auto mb-6">

          {/* Select */}
          <div className="relative w-full md:w-64">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 h-12">
              <selectedType.icon className="w-5 h-5 text-gray-600" />
              <select
                className="flex-1 bg-transparent outline-none text-sm font-medium"
                onChange={(e) => {
                  const type = channelTypes.find(t => t.id === e.target.value);
                  setSelectedType(type);
                  setInputValue('');
                }}
              >
                {channelTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Input */}
          <div className="flex-1 w-full">
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 h-12">
              {selectedType.id === 'email' && (
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />
              )}
              <input
                type={selectedType.id === 'email' ? 'email' : 'text'}
                placeholder={selectedType.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Button */}
        <button className="w-full max-w-2xl h-12 bg-[#1E6BC8] text-white rounded-xl font-medium hover:bg-blue-700 transition">
          Verify
        </button>

      </div>
    </div>
  );
};

export default Verify;