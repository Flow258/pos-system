// components/TabNavigation.jsx
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
    <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm ${
            activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <tab.icon className="w-5 h-5" />
          <span className="capitalize">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;