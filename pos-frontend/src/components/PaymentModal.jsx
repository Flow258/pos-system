// components/PaymentModal.jsx
import React, { useState } from 'react';
import { X, DollarSign, Smartphone, Wallet } from 'lucide-react';

const PaymentModal = ({ selectedCustomerDetails, setShowPaymentModal, processPayment, showNotification }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }
    if (amount > parseFloat(selectedCustomerDetails.credit_balance)) {
      showNotification('Payment amount cannot exceed utang balance', 'error');
      return;
    }
    processPayment(selectedCustomerDetails.id, amount, paymentMethod);
    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Pay Utang for {selectedCustomerDetails.name}</h2>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Utang Balance</label>
              <p className="text-lg font-semibold text-orange-600">₱{parseFloat(selectedCustomerDetails.credit_balance).toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Amount *</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs font-medium">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('gcash')}
                  className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-medium">GCash</span>
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handlePayment}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Record Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;