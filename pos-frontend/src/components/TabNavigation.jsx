import React from 'react';
import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'sales', icon: ShoppingCart, label: 'sales' },
    { id: 'inventory', icon: Package, label: 'inventory' },
    { id: 'customers', icon: Users, label: 'customers' },
    { id: 'reports', icon: TrendingUp, label: 'reports' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-1.5 sm:p-2 flex gap-1 sm:gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
            activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline capitalize">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;