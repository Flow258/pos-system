import React, { useState, useDeferredValue } from 'react';
import { Plus, Download, Search, History, Pencil, Wallet, Users, Phone, MapPin } from 'lucide-react';

const CustomersInterface = ({ customers, editCustomer, setShowCustomerModal, viewCustomerHistory, setShowPaymentModal, setSelectedCustomerDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // ── INP FIX: Defer search filtering so typing doesn't lag ──
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // ── Export Master Customer List to Excel ──
  const exportToCSV = () => {
    if (customers.length === 0) { alert('No customers to export!'); return; }

    const headers = ['Customer Name', 'Phone Number', 'Address', 'Utang Balance'];
    const rows = customers.map(c => [
      `"${c.name || ''}"`,
      `"${c.phone_number || ''}"`,
      `"${c.address || ''}"`,
      c.credit_balance || 0
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_master_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
      (customer.phone_number && customer.phone_number.includes(deferredSearchTerm));
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-0 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Customer Management ({filteredCustomers.length})
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={exportToCSV}
            className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowCustomerModal(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or phone number..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MOBILE VIEW: Cards (Shown only on phones)                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No customers found.</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const hasUtang = parseFloat(customer.credit_balance) > 0;
            return (
              <div key={customer.id} className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${hasUtang ? 'border-orange-500' : 'border-transparent'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">{customer.name}</h3>
                    {customer.phone_number && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> {customer.phone_number}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Utang</p>
                    <p className={`text-lg font-bold ${hasUtang ? 'text-orange-600' : 'text-gray-400'}`}>
                      ₱{parseFloat(customer.credit_balance).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  <button 
                    onClick={() => viewCustomerHistory(customer)} 
                    className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1 active:scale-95"
                  >
                    <History className="w-4 h-4" /> History
                  </button>
                  <button 
                    onClick={() => editCustomer(customer)} 
                    className="flex-1 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  {hasUtang && (
                    <button 
                      onClick={() => {
                        setSelectedCustomerDetails(customer);
                        setShowPaymentModal(true);
                      }} 
                      className="flex-1 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Wallet className="w-4 h-4" /> Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DESKTOP VIEW: Table (Shown only on tablets and PCs)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name & Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Address</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Utang Balance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No customers found.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const hasUtang = parseFloat(customer.credit_balance) > 0;
                  return (
                    <tr key={customer.id} className={`hover:bg-gray-50 ${hasUtang ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-4 py-3 align-top">
                        <p className="font-bold text-gray-800 text-sm">{customer.name}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {customer.phone_number ? customer.phone_number : 'No phone'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 align-top max-w-[200px] truncate">
                        {customer.address || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <span className={`text-base font-bold ${hasUtang ? 'text-orange-600' : 'text-gray-400'}`}>
                          ₱{parseFloat(customer.credit_balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                          <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => viewCustomerHistory(customer)} 
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                            title="View History"
                          >
                            <History className="w-5 h-5" />
                          </button>
                          <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editCustomer(customer)} 
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                            title="Edit Customer"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          {hasUtang && (
                            <button 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedCustomerDetails(customer);
                                setShowPaymentModal(true);
                              }} 
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors active:scale-95 shadow-sm"
                              title="Pay Utang"
                            >
                              <Wallet className="w-4 h-4" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomersInterface;