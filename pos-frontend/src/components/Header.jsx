// components/Header.jsx
import React from 'react';

const Header = () => (
  <div className="bg-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alquizalas Store POS System</h1>
          <p className="text-sm text-gray-600">Professional Point of Sale & Inventory</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Cashier: Admin</p>
          <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  </div>
);

export default Header;