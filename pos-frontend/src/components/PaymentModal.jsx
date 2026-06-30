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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold">Pay Utang for {selectedCustomerDetails.name}</h2>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-500 hover:text-gray-700 active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-xs sm:text-sm font-medium mb-1">Current Utang Balance</label>
              <p className="text-base sm:text-lg font-semibold text-orange-600">₱{parseFloat(selectedCustomerDetails.credit_balance).toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Payment Amount *</label>
              <input
                type="number"
                inputMode="decimal"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-right text-base sm:text-lg"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 sm:py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs font-medium">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('gcash')}
                  className={`py-2 sm:py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-medium">GCash</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handlePayment}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 text-sm active:scale-95"
              >
                <Wallet className="w-5 h-5" />
                Record Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 text-sm"
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