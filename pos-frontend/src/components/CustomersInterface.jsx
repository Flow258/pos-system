// components/CustomersInterface.jsx
import React from 'react';
import { Plus } from 'lucide-react';

const CustomersInterface = ({ customers, editCustomer, setShowCustomerModal, viewCustomerHistory, setShowPaymentModal, setSelectedCustomerDetails }) => (
  <div className="space-y-4">
    <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Customer Management ({customers.length})</h2>
      <button
        onClick={() => setShowCustomerModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Customer
      </button>
    </div>

    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Contact</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Address</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Utang Balance</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {customers.map(customer => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{customer.name}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{customer.phone_number || 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{customer.address || 'N/A'}</td>
              <td className="px-4 py-3 text-right font-semibold text-orange-600">
                ₱{parseFloat(customer.credit_balance).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-center space-x-2">
                <button onClick={() => viewCustomerHistory(customer)} className="text-gray-600 hover:text-gray-800 p-1">
                  History
                </button>
                <button onClick={() => editCustomer(customer)} className="text-blue-600 hover:text-blue-800 p-1">
                  Edit
                </button>
                {customer.credit_balance > 0 && (
                  <button 
                    onClick={() => {
                      setSelectedCustomerDetails(customer);
                      setShowPaymentModal(true);
                    }} 
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    Pay Utang
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default CustomersInterface;