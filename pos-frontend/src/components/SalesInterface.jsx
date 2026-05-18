// components/SalesInterface.jsx
import React from 'react';
import { ShoppingCart, Barcode, Camera, Trash2, Minus, Plus, X, DollarSign, CreditCard, Smartphone } from 'lucide-react';

const SalesInterface = ({
  barcodeInputRef, barcodeInput, setBarcodeInput, handleBarcodeScan, cart, setCart,
  updateQuantity, removeFromCart, customers, selectedCustomer, setSelectedCustomer,
  paymentMethod, setPaymentMethod, amountPaid, setAmountPaid, calculateTotal,
  calculateChange, completeSale, setShowVisionScanner
}) => (
  <div className="flex gap-4 h-full">
    {/* Left Panel: Scanner and Cart */}
    <div className="flex-1 flex flex-col gap-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <Barcode className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Scan Product</h3>
        </div>
        <div className="flex gap-2">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && barcodeInput.trim()) {
                handleBarcodeScan(barcodeInput.trim());
              }
            }}
            placeholder="Scan barcode or type and press Enter..."
            className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
          />
          <button
            onClick={() => setShowVisionScanner(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 font-semibold"
          >
            <Camera className="w-5 h-5" />
            AI Scan
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Shopping Cart ({cart.length})</h3>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-2 opacity-30" />
              <p>Cart is empty</p>
              <p className="text-sm">Scan products to begin</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {cart.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.unit_name} • ₱{parseFloat(item.price).toFixed(2)}
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                      {item.price_type}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center">
                    <Plus className="w-4 h-5" />
                  </button>
                </div>
                <div className="w-24 text-right">
                  <p className="font-semibold text-lg">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Right Panel: Checkout */}
    <div className="w-96 bg-white rounded-lg shadow-md p-4 flex flex-col">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
        <DollarSign className="w-5 h-5 text-green-600" />
        Checkout
      </h3>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">Customer (Optional)</label>
        <select value={selectedCustomer || ''} onChange={(e) => setSelectedCustomer(e.target.value || null)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 bg-white">
          <option value="">Walk-in Customer</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name} {customer.credit_balance > 0 && `(₱${parseFloat(customer.credit_balance).toFixed(2)} utang)`}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setPaymentMethod('cash')} className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-medium">Cash</span>
          </button>
          <button onClick={() => setPaymentMethod('gcash')} className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
            <Smartphone className="w-5 h-5" />
            <span className="text-xs font-medium">GCash</span>
          </button>
          <button onClick={() => setPaymentMethod('credit')} className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Credit</span>
          </button>
        </div>
      </div>

      {paymentMethod !== 'credit' && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Amount Paid</label>
          <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-right text-lg" />
        </div>
      )}

      <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₱{calculateTotal().toFixed(2)}</span>
          </div>
          {paymentMethod !== 'credit' && amountPaid > 0 && (
            <>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">₱{parseFloat(amountPaid).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-2 border-t mt-2">
                <span>Change:</span>
                <span className={calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ₱{calculateChange().toFixed(2)}
                </span>
              </div>
            </>
          )}
          {paymentMethod === 'credit' && (
            <div className="flex justify-between text-2xl font-bold pt-2 border-t mt-2">
              <span>Total (Credit):</span>
              <span className="text-orange-600">₱{calculateTotal().toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <button onClick={completeSale} disabled={cart.length === 0} className={`w-full py-4 rounded-lg font-semibold text-white text-lg transition-colors ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
        Complete Sale
      </button>
    </div>
  </div>
);

export default SalesInterface;