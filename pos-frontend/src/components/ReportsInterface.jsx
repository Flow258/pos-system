// components/ReportsInterface.jsx
import React, { useRef, useState } from 'react';
import {
  TrendingUp, DollarSign, ShoppingCart, CreditCard, Smartphone,
  Wallet, AlertCircle, Printer, Calendar, ChevronDown, ChevronUp,
  FileText, BarChart3, RefreshCw, Eye, EyeOff
} from 'lucide-react';

const fmt = (n) =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

const ReportsInterface = ({
  reportType, setReportType,
  reportDate, setReportDate,
  reportStartDate, setReportStartDate,
  reportEndDate, setReportEndDate,
  loadSalesReport, salesData, loading,
  calculateSummary, showNotification,
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [showAllColumns, setShowAllColumns] = useState(false);
  const printRef = useRef();

  const summary = calculateSummary();

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Quick Date Presets ─────────────────────────────────────
  const today = () => new Date().toISOString().split('T')[0];

  const yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const thisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const thisMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  const setPreset = (preset) => {
    if (preset === 'today') {
      setReportType('daily');
      setReportDate(today());
    } else if (preset === 'yesterday') {
      setReportType('daily');
      setReportDate(yesterday());
    } else if (preset === 'this-week') {
      setReportType('range');
      setReportStartDate(thisWeek());
      setReportEndDate(today());
    } else if (preset === 'this-month') {
      setReportType('range');
      setReportStartDate(thisMonth());
      setReportEndDate(today());
    }
    setTimeout(() => loadSalesReport(), 50);
  };

  // ── Pagination ──────────────────────────────────────────────
  const pagination = salesData && salesData.data
    ? {
        currentPage: salesData.current_page || 1,
        lastPage:    salesData.last_page || 1,
        total:       salesData.total || 0,
        perPage:     salesData.per_page || 50,
      }
    : null;

  // ── Print Report ────────────────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const now = new Date().toLocaleString('en-PH');

    const periodLabel = reportType === 'daily'
      ? `Date: ${reportDate}`
      : `From: ${reportStartDate}  To: ${reportEndDate}`;

    const win = window.open('', '_blank', 'width=500,height=700');
    win.document.write(`
      <html>
        <head>
          <title>Sales Report - Alquizalas Store</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 3mm;
              color: #000;
            }
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { padding: 3mm; }
            }
            .center { text-align: center; }
            .right  { text-align: right; }
            .bold   { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 1px 0; }
            th { text-align: left; padding: 2px 0; border-bottom: 1px solid #000; }
            .th-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center">
            <div style="font-weight: bold; font-size: 16px;">ALQUIZALAS STORE</div>
            <div style="font-size: 11px;">Toledo, Bato, Cebu</div>
            <div style="font-size: 11px;">0917-XXX-XXXX</div>
          </div>
          <hr />
          <div class="center bold" style="font-size: 13px; margin: 4px 0;">SALES REPORT</div>
          <div class="center" style="font-size: 11px;">${periodLabel}</div>
          <hr />
          ${content}
          <hr />
          <div class="center" style="font-size: 11px; margin-top: 6px;">
            <div>Printed: ${now}</div>
            <div style="margin-top: 4px; font-size: 10px; color: #666;">— Alquizalas Store —</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 350);
  };

  return (
    <div className="space-y-4">

      {/* ═══ Report Controls ═══ */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Sales Reports
          </h2>
          <button
            onClick={loadSalesReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setPreset('today')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200">
            Today
          </button>
          <button onClick={() => setPreset('yesterday')}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200">
            Yesterday
          </button>
          <button onClick={() => setPreset('this-week')}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200">
            This Week
          </button>
          <button onClick={() => setPreset('this-month')}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200">
            This Month
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="daily">Daily Report</option>
              <option value="range">Date Range</option>
            </select>
          </div>

          {reportType === 'daily' ? (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={loadSalesReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Summary Cards ═══ */}
      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmt(summary.totalSales)}</p>
              <p className="text-xs text-gray-400 mt-1">{summary.totalTransactions} transaction(s)</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">Avg. Transaction</p>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmt(summary.averageTransaction)}</p>
              <p className="text-xs text-gray-400 mt-1">per sale</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">Payments Received</p>
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-teal-600">
                {fmt(Math.abs(summary.paymentTotal))}
              </p>
              <p className="text-xs text-gray-400 mt-1">{summary.paymentTransactions} payment(s)</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">Credit Sales</p>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-orange-600">{fmt(summary.creditSales)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {summary.totalSales > 0
                  ? ((summary.creditSales / summary.totalSales) * 100).toFixed(1) + '% of total'
                  : '0% of total'}
              </p>
            </div>
          </div>

          {/* Payment Method Breakdown Bars */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Payment Method Breakdown
            </h3>
            {summary.totalSales > 0 ? (
              <div className="space-y-4">
                {[
                  { label: 'Cash',     value: summary.cashSales,   color: 'bg-green-500',  icon: DollarSign,  textColor: 'text-green-600' },
                  { label: 'GCash',    value: summary.gcashSales,  color: 'bg-blue-500',   icon: Smartphone,  textColor: 'text-blue-600' },
                  { label: 'Credit (Utang)', value: summary.creditSales, color: 'bg-orange-500', icon: CreditCard, textColor: 'text-orange-600' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5">
                        <item.icon className={`w-4 h-4 ${item.textColor}`} />
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <span className={`font-semibold ${item.textColor}`}>{fmt(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${(item.value / summary.totalSales) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {((item.value / summary.totalSales) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">No sales data to show breakdown.</p>
            )}
          </div>
        </>
      )}

      {/* ═══ Print template (hidden) — This is captured as innerHTML for the print window ═══ */}
      <div ref={printRef} style={{ display: 'none' }}>
        {summary && (
          <>
            <table>
              <tbody>
                <tr><td>Total Sales</td><td className="right bold">{fmt(summary.totalSales)}</td></tr>
                <tr><td>Transactions</td><td className="right">{summary.totalTransactions}</td></tr>
                <tr><td>Avg. Transaction</td><td className="right">{fmt(summary.averageTransaction)}</td></tr>
              </tbody>
            </table>
            <hr />
            <table>
              <tbody>
                <tr><td>Cash</td><td className="right">{fmt(summary.cashSales)}</td></tr>
                <tr><td>GCash</td><td className="right">{fmt(summary.gcashSales)}</td></tr>
                <tr><td>Credit (Utang)</td><td className="right">{fmt(summary.creditSales)}</td></tr>
                <tr><td>Payments Received</td><td className="right">{fmt(Math.abs(summary.paymentTotal))}</td></tr>
              </tbody>
            </table>
          </>
        )}
        {salesData?.data?.length > 0 && (
          <>
            <hr />
            <div className="center bold" style={{ fontSize: '11px', margin: '4px 0' }}>TRANSACTIONS</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="th-right">Amount</th>
                  <th className="th-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {salesData.data.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '10px' }}>{new Date(t.sale_date).toLocaleDateString('en-PH')}</td>
                    <td style={{ fontSize: '10px' }}>{t.customer?.name || 'Walk-in'}</td>
                    <td className="right" style={{ fontSize: '10px' }}>
                      {t.payment_method === 'payment' ? '-' : ''}{fmt(Math.abs(parseFloat(t.total_amount)))}
                    </td>
                    <td className="right" style={{ fontSize: '10px' }}>{t.sale_items?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* ═══ Transactions Table ═══ */}
      {salesData && salesData.data && salesData.data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-gray-700">
              <FileText className="w-5 h-5 text-gray-500" />
              Sales & Payment Transactions
              {pagination && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
                  {pagination.total} total
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 border rounded-lg"
              >
                {showAllColumns ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showAllColumns ? 'Compact' : 'Show Items'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-6"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  {showAllColumns && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesData.data.map((transaction) => {
                  const isPayment = transaction.payment_method === 'payment';
                  const isExpanded = expandedRows[transaction.id];
                  const items = transaction.sale_items || [];

                  return (
                    <React.Fragment key={transaction.id}>
                      <tr
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isPayment ? 'bg-green-50/30' : ''}`}
                        onClick={() => items.length > 0 && toggleRow(transaction.id)}
                      >
                        <td className="px-4 py-3 text-gray-300 text-sm text-center w-6">
                          {items.length > 0 ? (
                            isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {new Date(transaction.sale_date).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={transaction.customer ? 'text-gray-800' : 'text-gray-400 italic'}>
                            {transaction.customer ? transaction.customer.name : 'Walk-in'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          <span className={isPayment ? 'text-green-600' : 'text-gray-800'}>
                            {isPayment ? '-' : ''}{fmt(Math.abs(parseFloat(transaction.total_amount)))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            transaction.payment_method === 'cash'    ? 'bg-green-100 text-green-700' :
                            transaction.payment_method === 'gcash'   ? 'bg-blue-100 text-blue-700' :
                            transaction.payment_method === 'credit'  ? 'bg-orange-100 text-orange-700' :
                            transaction.payment_method === 'payment' ? 'bg-teal-100 text-teal-700' :
                                                                       'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.payment_method === 'payment' ? 'PAYMENT' : transaction.payment_method.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : '—'}
                        </td>
                        {showAllColumns && (
                          <td className="px-4 py-3 text-right text-sm">
                            {isPayment ? fmt(Math.abs(parseFloat(transaction.amount_paid))) : fmt(parseFloat(transaction.amount_paid))}
                          </td>
                        )}
                      </tr>

                      {/* Expanded items row */}
                      {isExpanded && items.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan={showAllColumns ? 7 : 6} className="px-4 py-3">
                            <div className="ml-6 space-y-1">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">
                                    <span className="font-medium">{item.product_unit?.product?.name || 'Product'}</span>
                                    <span className="text-gray-400 ml-2">
                                      ({item.product_unit?.unit_name}) × {item.quantity}
                                    </span>
                                  </span>
                                  <span className="font-semibold text-gray-600">
                                    {fmt(parseFloat(item.subtotal))}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-2">
                                <span className="font-medium text-gray-600">Transaction Total</span>
                                <span className="font-bold text-gray-800">
                                  {fmt(Math.abs(parseFloat(transaction.total_amount)))}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.lastPage > 1 && (
            <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                  ← Prev
                </button>
                <button
                  disabled={pagination.currentPage >= pagination.lastPage}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Table footer summary */}
          <div className="px-5 py-3 border-t bg-gray-50">
            <div className="flex justify-end gap-8 text-sm">
              <div>
                <span className="text-gray-500">Total Sales: </span>
                <span className="font-bold text-gray-800">{fmt(summary?.totalSales || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">Payments: </span>
                <span className="font-bold text-teal-600">{fmt(Math.abs(summary?.paymentTotal || 0))}</span>
              </div>
              <div>
                <span className="text-gray-500">Transactions: </span>
                <span className="font-bold text-gray-800">{summary?.totalTransactions || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Empty states ═══ */}
      {salesData && salesData.data && salesData.data.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2 text-gray-600">No Transactions Found</h3>
          <p className="text-gray-400">No sales or payment transactions for the selected period.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => setPreset('today')} className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200">
              Try Today
            </button>
            <button onClick={() => setPreset('this-month')} className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200">
              Try This Month
            </button>
          </div>
        </div>
      )}

      {!salesData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2 text-gray-600">Generate Sales Report</h3>
          <p className="text-gray-400">Select a date or date range and click "Generate Report"</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <RefreshCw className="w-10 h-10 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-gray-500 font-medium">Loading report data...</p>
        </div>
      )}
    </div>
  );
};

export default ReportsInterface;