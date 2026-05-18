// components/ReportsInterface.jsx
import React from 'react';
import { TrendingUp, DollarSign, ShoppingCart, CreditCard, Smartphone, Wallet, AlertCircle } from 'lucide-react';

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

export default ReportsInterface;