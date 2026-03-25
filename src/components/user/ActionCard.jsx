import React from 'react';

const ActionCard = ({ title, description, icon, buttonOrder, variant = 'green', onClick }) => {
  const buttonStyles = {
    green: 'bg-[#134e4a] hover:bg-[#134e4a]/90 text-white',
    blue: 'bg-[#0f2a4a] hover:bg-[#0f2a4a]/90 text-white',
    light: 'bg-[#e8e1d5] hover:brightness-95 text-gray-800',
  };

  return (
    <div className="bg-white p-8 rounded-3xl flex flex-col items-start gap-4 transition-transform hover:scale-[1.02]">
      <div className={`p-3 rounded-xl ${variant === 'green' ? 'bg-green-50 text-green-600' : variant === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={`mt-2 px-6 py-2.5 rounded-xl font-bold transition-all ${buttonStyles[variant === 'green' ? 'green' : variant === 'blue' ? 'blue' : 'light']}`}
      >
        {buttonOrder}
      </button>
    </div>
  );
};

export default ActionCard;
