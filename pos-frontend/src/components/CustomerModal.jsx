import React from 'react';
import { X, Save } from 'lucide-react';

const CustomerModal = ({ editingCustomer, setEditingCustomer, setShowCustomerModal, customerForm, setCustomerForm, saveCustomer, resetCustomerForm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md max-h-[95vh] flex flex-col overflow-hidden">
      
      {/* Header (Sticky) */}
      <div className="p-4 sm:p-6 border-b shrink-0 flex justify-between items-center">
        <h2 className="text-lg sm:text-2xl font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowCustomerModal(false);
            setEditingCustomer(null);
            resetCustomerForm();
          }}
          className="text-gray-500 hover:text-gray-700 active:scale-90 p-1"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Body (Scrollable) */}
      <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Customer Name *</label>
          <input type="text" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="e.g., Maria's Sari-Sari Store" />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Phone Number</label>
          <input type="tel" inputMode="tel" value={customerForm.phone_number} onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="e.g., 09171234567" />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Address</label>
          <textarea value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm" rows="2" placeholder="Customer address" />
        </div>
        {editingCustomer && (
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Current Utang Balance</label>
            <input type="number" inputMode="decimal" value={customerForm.credit_balance} onChange={(e) => setCustomerForm({ ...customerForm, credit_balance: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm" placeholder="0.00" />
          </div>
        )}
      </div>

      {/* Footer (Sticky) */}
      <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 shrink-0">
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={saveCustomer} 
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 text-sm active:scale-95"
        >
          <Save className="w-5 h-5" />
          {editingCustomer ? 'Update Customer' : 'Save Customer'}
        </button>
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { setShowCustomerModal(false); setEditingCustomer(null); resetCustomerForm(); }} 
          className="px-6 py-3 border rounded-lg hover:bg-gray-100 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default CustomerModal;