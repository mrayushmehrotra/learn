import React, { useState } from 'react';

const tabList = ["Live Ranking", "Party Ranking", "Hourly Ranking", "Wealth Ranking"];

const Tabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(tabList[0]);
  return (
    <div className="flex gap-4 overflow-x-auto border-b border-gray-200 bg-white">
      {tabList.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
            activeTab === tab
              ? tab === "Live Ranking"
                ? "border-b-2 border-green-500 text-green-700 bg-green-50 rounded-t-md"
                : "border-b-2 border-yellow-400 text-yellow-600 bg-yellow-50 rounded-t-md"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs; 