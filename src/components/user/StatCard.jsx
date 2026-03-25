import React from 'react';

const StatCard = ({ title, value, subtext, icon, variant = 'light' }) => {
  const isDark = variant === 'dark';
  
  return (
    <div className={`p-6 rounded-2xl flex items-center justify-between ${
      isDark ? 'bg-[#1e4b7a] text-white shadow-lg' : 'bg-white text-gray-800'
    }`}>
      <div>
        <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
        {subtext && <p className={`text-xs mt-1 font-medium ${isDark ? 'text-[#4ade80]' : 'text-gray-400'}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${isDark ? 'bg-[#2a5d8f]' : 'bg-gray-50'}`}>
        <div className={isDark ? 'text-white' : 'text-gray-500'}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
