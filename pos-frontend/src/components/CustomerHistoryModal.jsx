// components/CustomerHistoryModal.jsx
import React from 'react';
import { X, ShoppingCart } from 'lucide-react';

const CustomerHistoryModal = ({ selectedCustomerDetails, setShowCustomerHistory, setSelectedCustomerDetails, customerSales, setCustomerSales }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{selectedCustomerDetails?.name}</h2>
            <p className="text-sm text-gray-600">{selectedCustomerDetails?.phone_number}</p>
            <p className="text-sm text-gray-600">{selectedCustomerDetails?.address}</p>
          </div>
          <button
            onClick={() => {
              setShowCustomerHistory(false);
              setSelectedCustomerDetails(null);
              setCustomerSales([]);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-4 p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Utang Balance:</span>
            <span className="text-2xl font-bold text-orange-600">
              ₱{parseFloat(selectedCustomerDetails?.credit_balance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-semibold mb-4">Utang History</h3>
        {customerSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No unpaid utang history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customerSales.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600">{new Date(transaction.sale_date).toLocaleString()}</p>
                    <p className="font-semibold text-lg">
                      {transaction.payment_method === 'payment' ? 'Payment' : 'Purchase'}: ₱{parseFloat(transaction.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    transaction.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                    transaction.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' :
                    transaction.payment_method === 'credit' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {transaction.payment_method === 'payment' ? 'PAYMENT' : transaction.payment_method.toUpperCase()}
                  </span>
                </div>
                {transaction.sale_items && transaction.sale_items.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {transaction.sale_items.map((item, idx) => (
                        <li key={idx}>
                          • {item.product_unit?.product?.name || 'Product'} ({item.product_unit?.unit_name}) x{item.quantity} = ₱{parseFloat(item.subtotal).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-6 border-t bg-gray-50">
        <button
          onClick={() => {
            setShowCustomerHistory(false);
            setSelectedCustomerDetails(null);
            setCustomerSales([]);
          }}
          className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default CustomerHistoryModal;