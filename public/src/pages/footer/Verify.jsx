import React, { useState } from 'react';
import { GlobeAltIcon, ChevronDownIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { SITE_ORIGIN, SITE_POSSESSIVE } from '../../config/site';

const ChannelVerification = () => {
  // Option types for the dropdown
  const channelTypes = [
    { id: 'website', name: 'Website', icon: GlobeAltIcon },
    { id: 'social', name: 'Social Media', icon: GlobeAltIcon }, // Example option
    { id: 'email', name: 'Email Address', icon: GlobeAltIcon }, // Example option
  ];

  const [selectedType, setSelectedType] = useState(channelTypes[0]);
  const [inputValue, setInputValue] = useState(SITE_ORIGIN);

  return (
    // Main Container - exact background color and centered layout
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-2xl px-4 py-12 md:px-12 md:py-16 text-center">
        
        {/* --- Upper Sub-header Area --- */}
        <div className="inline-flex flex-col items-center gap-1 mb-6 text-sm">
          <p className="text-[#6C7A8A]">Make sure you are on the official website</p>
          <div className="flex items-center gap-2 bg-[#F1F3F6] border border-[#E2E8F0] px-4 py-1.5 rounded-full text-[#4F5B6A] shadow-inner-sm">
            <LockClosedIcon className="w-4 h-4 text-[#ABB3C1]" />
            <span className="font-medium text-[13px]">{SITE_ORIGIN}</span>
          </div>
        </div>

        {/* --- Main Heading --- */}
        <h1 className="text-3xl md:text-[36px] font-extrabold leading-tight mb-6 text-[#0A1A31]">
          Verification of {SITE_POSSESSIVE}<br />
          communication channels
        </h1>

        {/* --- Description Text --- */}
        <p className="max-w-xl mx-auto text-sm leading-[1.6] text-[#6C7A8A] mb-10 font-normal">
          To prevent fraud, we have created a page to verify {SITE_POSSESSIVE} channels and business accounts. 
          Below you can check all official communication channels: social media groups, websites, 
          email addresses, and business accounts.
        </p>

        {/* --- Form Area --- */}
        <form className="max-w-xl mx-auto space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Dropdown - Select type */}
            <div className="relative flex-none md:w-[170px]">
              <div className="relative">
                {/* Floating label for 'Select type' */}
                <label className="absolute -top-1.5 left-8 px-1.5 bg-[#F8FAFC] text-[10px] font-medium text-[#ABB3C1]">
                  Select type
                </label>
                
                {/* Custom select element for perfect alignment */}
                <select 
                  value={selectedType.id}
                  onChange={(e) => {
                    const newType = channelTypes.find(t => t.id === e.target.value);
                    setSelectedType(newType);
                  }}
                  className="w-full h-[52px] bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-10 text-sm font-medium text-[#1E293B] shadow-sm appearance-none focus:ring-1 focus:ring-blue-200 focus:border-[#CDD6E1] outline-none"
                >
                  {channelTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>

                {/* Left Icon (Globe) */}
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <selectedType.icon className="w-5 h-5 text-[#1E293B]" />
                </div>

                {/* Right Icon (Chevron Down) */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <ChevronDownIcon className="w-5 h-5 text-[#1E293B]" />
                </div>
              </div>
            </div>

            {/* Input - URL */}
            <div className="flex-grow">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={SITE_ORIGIN}
                className="w-full h-[52px] bg-white border border-[#E2E8F0] rounded-xl px-5 text-sm font-medium text-[#1E293B] shadow-sm placeholder-[#ABB3C1] focus:ring-1 focus:ring-blue-200 focus:border-[#CDD6E1] outline-none"
              />
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div>
            <button 
              type="submit" 
              className="w-full h-[52px] bg-[#1070E0] text-white font-semibold text-sm rounded-xl hover:bg-[#0D5FBB] transition duration-200 active:scale-[0.98] focus:ring-2 focus:ring-blue-300 outline-none"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChannelVerification;