import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Package, Users, TrendingUp, Barcode, X, Plus, Minus, Trash2, DollarSign, CreditCard, Smartphone, Save, Edit, AlertCircle, CheckCircle, XCircle, Wallet, Camera, Loader } from 'lucide-react';

// API Base URL - Change this to your Laravel backend URL
const API_BASE = 'http://127.0.0.1:8000/api';

// ===================================================================
// Helper & UI Components
// ===================================================================

const SalesInterface = ({
  barcodeInputRef, barcodeInput, setBarcodeInput, handleBarcodeScan, cart, setCart,
  updateQuantity, removeFromCart, customers, selectedCustomer, setSelectedCustomer,
  paymentMethod, setPaymentMethod, amountPaid, setAmountPaid, calculateTotal,
  calculateChange, completeSale
}) => (
  <div className="flex gap-4 h-full">
    {/* Left Panel: Scanner and Cart */}
    <div className="flex-1 flex flex-col gap-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <Barcode className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Scan Product</h3>
        </div>
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
          className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
        />
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
                    <Plus className="w-4 h-4" />
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

const InventoryInterface = ({ products, editProduct, resetProductForm, setEditingProduct, setShowProductModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const isLowStock = product.stock_quantity <= product.low_stock_threshold;
    const matchesLowStock = !showLowStockOnly || isLowStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Product Inventory ({filteredProducts.length})</h2>
        <button
          onClick={() => {
            resetProductForm();
            setEditingProduct(null);
            setShowProductModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center pt-6 md:pt-0">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium">Show low stock only</label>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">Adjust your filters or add a new product</p>
          <button
            onClick={() => {
              resetProductForm();
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Units & Prices</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600 max-w-xs truncate">{product.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="text-sm text-gray-700">{product.category || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-lg align-top">{product.stock_quantity}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      {product.product_units.map(unit => (
                        <div key={unit.id} className="text-sm">
                          <span className="font-medium">{unit.unit_name}:</span>
                          <span className="text-gray-700"> ₱{parseFloat(unit.price).toFixed(2)} </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${unit.price_type === 'retail' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{unit.price_type}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {product.stock_quantity <= 0 ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-red-600"><XCircle className="w-4 h-4" /> Out of Stock</span>
                    ) : product.stock_quantity <= product.low_stock_threshold ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-orange-600"><AlertCircle className="w-4 h-4" /> Low Stock</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4" /> In Stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center align-top">
                    <button onClick={() => editProduct(product)} className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50">
                      <Edit className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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

const ReportsInterface = ({ reportType, setReportType, reportDate, setReportDate, reportStartDate, setReportStartDate, reportEndDate, setReportEndDate, loadSalesReport, salesData, loading, calculateSummary, showNotification }) => {
  const summary = calculateSummary();

  return (
    <div className="space-y-4">
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Sales Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="daily">Daily Report</option>
              <option value="range">Date Range</option>
            </select>
          </div>

          {reportType === 'daily' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={loadSalesReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">₱{summary.totalSales.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-purple-600">₱{summary.averageTransaction.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credit Sales</p>
                <p className="text-2xl font-bold text-orange-600">₱{summary.creditSales.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Cash Sales
            </h3>
            <p className="text-2xl font-bold text-green-600">₱{summary.cashSales.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {summary.totalSales > 0 ? ((summary.cashSales / summary.totalSales) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              GCash Sales
            </h3>
            <p className="text-2xl font-bold text-blue-600">₱{summary.gcashSales.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {summary.totalSales > 0 ? ((summary.gcashSales / summary.totalSales) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              Credit Sales (Utang)
            </h3>
            <p className="text-2xl font-bold text-orange-600">₱{summary.creditSales.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {summary.totalSales > 0 ? ((summary.creditSales / summary.totalSales) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Payments Received
            </h3>
            <p className="text-2xl font-bold text-green-600">₱{summary.paymentTotal.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {summary.paymentTransactions} payment(s)
            </p>
          </div>
        </div>
      )}

      {salesData && salesData.data && salesData.data.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Sales & Payment Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesData.data.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(transaction.sale_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {transaction.customer ? transaction.customer.name : 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₱{parseFloat(transaction.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                        transaction.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' :
                        transaction.payment_method === 'credit' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {transaction.payment_method === 'payment' ? 'PAYMENT' : transaction.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {transaction.sale_items ? transaction.sale_items.length : 0} items
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {salesData && salesData.data && salesData.data.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
          <p className="text-gray-600">No sales or payment transactions for the selected period.</p>
        </div>
      )}

      {!salesData && !loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Generate Sales Report</h3>
          <p className="text-gray-600">Select a date or date range and click "Generate Report"</p>
        </div>
      )}
    </div>
  );
};

const CustomerModal = ({ editingCustomer, setEditingCustomer, setShowCustomerModal, customerForm, setCustomerForm, saveCustomer, resetCustomerForm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button
            onClick={() => {
              setShowCustomerModal(false);
              setEditingCustomer(null);
              resetCustomerForm();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input type="text" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g., Maria's Sari-Sari Store" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input type="text" value={customerForm.phone_number} onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g., 09171234567" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" rows="2" placeholder="Customer address" />
          </div>
          {editingCustomer && (
            <div>
              <label className="block text-sm font-medium mb-1">Current Utang Balance</label>
              <input type="number" value={customerForm.credit_balance} onChange={(e) => setCustomerForm({ ...customerForm, credit_balance: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" placeholder="0.00" />
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button onClick={saveCustomer} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
            <button onClick={() => { setShowCustomerModal(false); setEditingCustomer(null); resetCustomerForm(); }} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

const ProductModal = ({ editingProduct, setEditingProduct, setShowProductModal, productForm, setProductForm, saveProduct, resetProductForm, addProductUnit, removeProductUnit, updateProductUnit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={() => { setShowProductModal(false); setEditingProduct(null); resetProductForm(); }} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" rows="2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Initial Stock Quantity *</label>
            <input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
            <input type="number" value={productForm.low_stock_threshold} onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="pt-4 mt-4 border-t">
          <h3 className="font-semibold mb-2">Units & Pricing</h3>
          <div className="space-y-4">
            {productForm.units.map((unit, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Unit {index + 1}</h4>
                  {productForm.units.length > 1 && (
                    <button onClick={() => removeProductUnit(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input type="text" placeholder="Unit Name (e.g., Piece)" value={unit.unit_name} onChange={e => updateProductUnit(index, 'unit_name', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
                  <input type="text" placeholder="Barcode *" value={unit.barcode} onChange={e => updateProductUnit(index, 'barcode', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
                  <input type="number" placeholder="Price *" value={unit.price} onChange={e => updateProductUnit(index, 'price', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
                  <select value={unit.price_type} onChange={e => updateProductUnit(index, 'price_type', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                  <input type="number" placeholder="Conversion Factor" value={unit.conversion_factor} onChange={e => updateProductUnit(index, 'conversion_factor', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" disabled={index === 0} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addProductUnit} className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Another Unit
          </button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
        <button onClick={() => { setShowProductModal(false); setEditingProduct(null); resetProductForm(); }} className="px-6 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
        <button onClick={saveProduct} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> {editingProduct ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </div>
  </div>
);

// ===================================================================
// Main POSSystem Component
// ===================================================================
const POSSystem = () => {

  const [showVisionScanner, setShowVisionScanner] = useState(false);

  const [activeTab, setActiveTab] = useState('sales');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notification, setNotification] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone_number: '', address: '', credit_balance: '0' });
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerSales, setCustomerSales] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'customers') {
      loadProducts();
      loadCustomers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'sales' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/customers`);
      const data = await response.json();
      if (data.success) setCustomers(data.data);
    } catch (error) {
      console.error('Error loading customers:', error);
      showNotification('Error loading customers', 'error');
    }
  };

  const saveCustomer = async () => {
    try {
      if (!customerForm.name) {
        showNotification('Please enter customer name', 'error');
        return;
      }
      const method = editingCustomer ? 'PUT' : 'POST';
      const url = editingCustomer ? `${API_BASE}/customers/${editingCustomer.id}` : `${API_BASE}/customers`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      const data = await response.json();
      if (data.success) {
        showNotification(editingCustomer ? 'Customer updated!' : 'Customer added!');
        setShowCustomerModal(false);
        setEditingCustomer(null);
        resetCustomerForm();
        loadCustomers();
      } else {
        showNotification(data.message || 'Error saving customer', 'error');
      }
    } catch (error) {
      showNotification('Error saving customer', 'error');
    }
  };

  const resetCustomerForm = () => setCustomerForm({ name: '', phone_number: '', address: '', credit_balance: '0' });

  const editCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone_number: customer.phone_number || '',
      address: customer.address || '',
      credit_balance: customer.credit_balance.toString()
    });
    setShowCustomerModal(true);
  };

  const viewCustomerHistory = async (customer) => {
    setSelectedCustomerDetails(customer);
    setShowCustomerHistory(true);
    try {
      // Fetch only unpaid credit sales
      const response = await fetch(`${API_BASE}/sales?customer_id=${customer.id}&payment_method=credit`);
      const data = await response.json();
      if (data.success) {
        setCustomerSales(data.data.data || []);
      } else {
        showNotification(data.message || 'Error loading customer history', 'error');
      }
    } catch (error) {
      console.error('Error loading customer history:', error);
      showNotification('Error loading customer history', 'error');
    }
  };

  const processPayment = async (customerId, amount, method) => {
    try {
      const response = await fetch(`${API_BASE}/customers/${customerId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), payment_method: method })
      });
      const data = await response.json();
      if (data.success) {
        showNotification(`Payment of ₱${amount.toFixed(2)} recorded successfully!`);
        loadCustomers();
        if (showCustomerHistory && selectedCustomerDetails) {
          // Update the customer details with the new balance
          setSelectedCustomerDetails({ ...selectedCustomerDetails, credit_balance: data.data.credit_balance });
          // Refresh the customer history
          viewCustomerHistory({ ...selectedCustomerDetails, credit_balance: data.data.credit_balance });
        }
      } else {
        showNotification(data.message || 'Error recording payment', 'error');
      }
    } catch (error) {
      showNotification('Error recording payment', 'error');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      if (data.success) setProducts(data.data);
    } catch (error) {
      showNotification('Error loading products', 'error');
    }
  };

  const handleBarcodeScan = async (barcode) => {
    if (!barcode.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/units/lookup?barcode=${barcode}`);
      const data = await response.json();
      if (data.success) {
        if (!data.data.stock_info.has_stock) {
          showNotification('Insufficient stock!', 'error');
          return;
        }
        addToCart(data.data);
        showNotification(`Added ${data.data.product.name} to cart`);
      } else {
        showNotification('Product not found', 'error');
      }
    } catch (error) {
      showNotification('Error scanning product', 'error');
    }
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const addToCart = (productUnit) => {
    const existingItem = cart.find(item => item.id === productUnit.id);
    if (existingItem) {
      updateQuantity(productUnit.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...productUnit, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const calculateTotal = () => cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const calculateChange = () => (parseFloat(amountPaid) || 0) - calculateTotal();

  const completeSale = async () => {
    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;
    if (cart.length === 0) return showNotification('Cart is empty', 'error');
    if (paid < total && paymentMethod !== 'credit') return showNotification('Insufficient payment', 'error');
    try {
      const saleData = {
        customer_id: selectedCustomer,
        total_amount: total,
        amount_paid: paymentMethod === 'credit' ? 0 : paid,
        change_due: paymentMethod === 'credit' ? 0 : calculateChange(),
        payment_method: paymentMethod,
        items: cart.map(item => ({ product_unit_id: item.id, quantity: item.quantity, unit_price: parseFloat(item.price), subtotal: parseFloat(item.price) * item.quantity }))
      };
      const response = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      const data = await response.json();
      if (data.success) {
        showNotification('Sale completed successfully!');
        setCart([]);
        setAmountPaid('');
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        loadProducts();
        loadCustomers();
      } else {
        showNotification(data.message || 'Error completing sale', 'error');
      }
    } catch (error) {
      showNotification('Error completing sale', 'error');
    }
  };

  const [productForm, setProductForm] = useState({ 
    name: '', 
    description: '', 
    category: '', 
    stock_quantity: '', 
    low_stock_threshold: '10', 
    units: [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }] 
  });

  const addProductUnit = () => setProductForm({ ...productForm, units: [...productForm.units, { unit_name: '', barcode: '', price: '', price_type: 'wholesale', conversion_factor: '' }] });

  const removeProductUnit = (index) => setProductForm({ ...productForm, units: productForm.units.filter((_, i) => i !== index) });

  const updateProductUnit = (index, field, value) => {
    const newUnits = [...productForm.units];
    newUnits[index][field] = value;
    setProductForm({ ...productForm, units: newUnits });
  };

  const saveProduct = async () => {
    try {
      if (!productForm.name || !productForm.stock_quantity) return showNotification('Please fill in Product Name and Stock Quantity', 'error');
      for (let i = 0; i < productForm.units.length; i++) {
        const unit = productForm.units[i];
        if (!unit.unit_name || !unit.barcode || !unit.price || !unit.conversion_factor) {
          return showNotification(`Please fill all fields for Unit ${i + 1}`, 'error');
        }
      }
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      const data = await response.json();
      if (data.success) {
        showNotification(editingProduct ? 'Product updated!' : 'Product created!');
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
        loadProducts();
      } else {
        showNotification(data.message || 'Error saving product', 'error');
      }
    } catch (error) {
      showNotification('Error saving product', 'error');
    }
  };

  const resetProductForm = () => setProductForm({ 
    name: '', 
    description: '', 
    category: '', 
    stock_quantity: '', 
    low_stock_threshold: '10', 
    units: [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }] 
  });

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      units: product.product_units?.length > 0 ? product.product_units.map(u => ({ 
        id: u.id, 
        unit_name: u.unit_name, 
        barcode: u.barcode, 
        price: u.price.toString(), 
        price_type: u.price_type, 
        conversion_factor: u.conversion_factor.toString() 
      })) : [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }]
    });
    setShowProductModal(true);
  };

  const loadSalesReport = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/sales?`;
      
      if (reportType === 'daily') {
        url += `start_date=${reportDate}&end_date=${reportDate}`;
      } else if (reportType === 'range' && reportStartDate && reportEndDate) {
        url += `start_date=${reportStartDate}&end_date=${reportEndDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSalesData(data.data);
      } else {
        showNotification(data.message || 'Error loading report', 'error');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      showNotification('Error loading report', 'error');
    }
    setLoading(false);
  };

  const calculateSummary = () => {
    if (!salesData || !salesData.data) return null;

    const sales = salesData.data;
    const totalSales = sales
      .filter(s => s.payment_method !== 'payment')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const cashSales = sales
      .filter(s => s.payment_method === 'cash')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const gcashSales = sales
      .filter(s => s.payment_method === 'gcash')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const creditSales = sales
      .filter(s => s.payment_method === 'credit')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const paymentTotal = sales
      .filter(s => s.payment_method === 'payment')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const paymentTransactions = sales.filter(s => s.payment_method === 'payment').length;
    const totalTransactions = sales.length - paymentTransactions;

    return {
      totalTransactions,
      totalSales,
      cashSales,
      gcashSales,
      creditSales,
      paymentTotal,
      paymentTransactions,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🏪 Alquizalas Store POS System</h1>
              <p className="text-sm text-gray-600">Professional Point of Sale & Inventory</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Cashier: Admin</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
          {['sales', 'inventory', 'customers', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab === 'sales' && <ShoppingCart className="w-5 h-5" />}
              {tab === 'inventory' && <Package className="w-5 h-5" />}
              {tab === 'customers' && <Users className="w-5 h-5" />}
              {tab === 'reports' && <TrendingUp className="w-5 h-5" />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-8" style={{ height: 'calc(100vh - 220px)' }}>
        {activeTab === 'sales' && (
          <SalesInterface 
            barcodeInputRef={barcodeInputRef}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            handleBarcodeScan={handleBarcodeScan}
            cart={cart}
            setCart={setCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            calculateTotal={calculateTotal}
            calculateChange={calculateChange}
            completeSale={completeSale}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryInterface 
            products={products}
            editProduct={editProduct}
            resetProductForm={resetProductForm}
            setEditingProduct={setEditingProduct}
            setShowProductModal={setShowProductModal}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersInterface 
            customers={customers}
            editCustomer={editCustomer}
            setShowCustomerModal={setShowCustomerModal}
            viewCustomerHistory={viewCustomerHistory}
            setShowPaymentModal={setShowPaymentModal}
            setSelectedCustomerDetails={setSelectedCustomerDetails}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsInterface 
            reportType={reportType}
            setReportType={setReportType}
            reportDate={reportDate}
            setReportDate={setReportDate}
            reportStartDate={reportStartDate}
            setReportStartDate={setReportStartDate}
            reportEndDate={reportEndDate}
            setReportEndDate={setReportEndDate}
            loadSalesReport={loadSalesReport}
            salesData={salesData}
            loading={loading}
            calculateSummary={calculateSummary}
            showNotification={showNotification}
          />
        )}
      </main>

      {showProductModal && (
        <ProductModal 
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          setShowProductModal={setShowProductModal}
          productForm={productForm}
          setProductForm={setProductForm}
          saveProduct={saveProduct}
          resetProductForm={resetProductForm}
          addProductUnit={addProductUnit}
          removeProductUnit={removeProductUnit}
          updateProductUnit={updateProductUnit}
        />
      )}
      {showCustomerModal && (
        <CustomerModal 
          editingCustomer={editingCustomer}
          setEditingCustomer={setEditingCustomer}
          setShowCustomerModal={setShowCustomerModal}
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          saveCustomer={saveCustomer}
          resetCustomerForm={resetCustomerForm}
        />
      )}
      {showCustomerHistory && (
        <CustomerHistoryModal 
          selectedCustomerDetails={selectedCustomerDetails}
          setShowCustomerHistory={setShowCustomerHistory}
          setSelectedCustomerDetails={setSelectedCustomerDetails}
          customerSales={customerSales}
          setCustomerSales={setCustomerSales}
        />
      )}
      {showPaymentModal && (
        <PaymentModal 
          selectedCustomerDetails={selectedCustomerDetails}
          setShowPaymentModal={setShowPaymentModal}
          processPayment={processPayment}
          showNotification={showNotification}
        />
      )}

      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold flex items-center gap-3 animate-fade-in-up ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default POSSystem;