import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  TrendingUp, DollarSign, ShoppingCart, CreditCard, Smartphone,
  Wallet, AlertCircle, Printer, Calendar, ChevronDown, ChevronUp,
  FileText, BarChart3, RefreshCw, Eye, EyeOff
} from 'lucide-react';

// ── Chart.js loader (injected once) ───────────────────────────
let chartJsReady = false;
let chartJsCallbacks = [];
const loadChartJs = (cb) => {
  if (chartJsReady) { cb(); return; }
  chartJsCallbacks.push(cb);
  if (document.getElementById('chartjs-cdn')) return;
  const s = document.createElement('script');
  s.id  = 'chartjs-cdn';
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
  s.onload = () => { chartJsReady = true; chartJsCallbacks.forEach(f => f()); chartJsCallbacks = []; };
  document.head.appendChild(s);
};

// ── Daily Trend Chart ──────────────────────────────────────────
const DailyTrendChart = ({ dailyLabels, dailyValues, fmt }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    loadChartJs(() => {
      if (!canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); }
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: dailyLabels.map(d => {
            const [y, m, day] = d.split('-');
            return `${parseInt(m)}/${parseInt(day)}`;
          }),
          datasets: [{
            label: 'Daily sales',
            data: dailyValues,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)',
            borderWidth: 2,
            pointRadius: dailyLabels.length <= 14 ? 4 : 2,
            pointBackgroundColor: '#2563eb',
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ' ' + fmt(ctx.parsed.y),
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
            y: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                font: { size: 11 },
                callback: v => '₱' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v),
              },
            },
          },
        },
      });
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [dailyLabels.join(','), dailyValues.join(',')]);

  const peak = dailyLabels[dailyValues.indexOf(Math.max(...dailyValues))];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm sm:text-base">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          Daily sales trend
        </h3>
        {peak && (
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
            Peak: {peak}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">{dailyLabels.length} days</p>
      <div style={{ position: 'relative', height: '220px' }}>
        <canvas ref={canvasRef}
          role="img"
          aria-label={`Line chart showing daily sales trend over ${dailyLabels.length} days`}>
          Daily sales data for {dailyLabels.length} days.
        </canvas>
      </div>
    </div>
  );
};

// ── Hourly Sales Chart ─────────────────────────────────────────
const HourlyChart = ({ hourLabels, hourValues, peakHour, fmt }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    loadChartJs(() => {
      if (!canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); }
      const bgColors = hourValues.map((_, i) =>
        i === peakHour ? '#2563eb' : 'rgba(37,99,235,0.18)'
      );
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: hourLabels,
          datasets: [{
            label: 'Sales by hour',
            data: hourValues,
            backgroundColor: bgColors,
            borderRadius: 4,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 0 },
            },
            y: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                font: { size: 11 },
                callback: v => v === 0 ? '' : '₱' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v),
              },
            },
          },
        },
      });
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [hourValues.join(','), peakHour]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm sm:text-base">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          Hourly sales
        </h3>
        <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
          Peak: {hourLabels[peakHour]}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">When are sales busiest?</p>
      <div style={{ position: 'relative', height: '200px' }}>
        <canvas ref={canvasRef}
          role="img"
          aria-label="Bar chart showing sales volume by hour of day">
          Hourly sales distribution across 24 hours.
        </canvas>
      </div>
    </div>
  );
};

const fmt = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// ── buildSummary ───────────────────────────────────────────────
const buildSummary = (salesData) => {
  if (!salesData?.data?.length) return null;

  let cashSales    = 0;
  let gcashSales   = 0;
  let creditSales  = 0;
  let paymentTotal = 0;
  let salesCount   = 0;
  let paymentCount = 0;

  for (const t of salesData.data) {
    const amount = Math.abs(parseFloat(t.total_amount) || 0);
    const method = (t.payment_method || '').toLowerCase();

    if (method === 'payment') {
      paymentTotal += amount;
      paymentCount += 1;
    } else {
      salesCount += 1;
      if (method === 'cash')        cashSales   += amount;
      else if (method === 'gcash')  gcashSales  += amount;
      else if (method === 'credit') creditSales += amount;
      else                          cashSales   += amount;
    }
  }

  const totalSales = cashSales + gcashSales + creditSales;

  return {
    totalSales,
    cashSales,
    gcashSales,
    creditSales,
    paymentTotal,
    totalTransactions: salesCount,
    paymentTransactions: paymentCount,
    averageTransaction: salesCount > 0 ? totalSales / salesCount : 0,
  };
};

const ReportsInterface = ({
  reportType, setReportType,
  reportDate, setReportDate,
  reportStartDate, setReportStartDate,
  reportEndDate, setReportEndDate,
  loadSalesReport,
  salesData,
  serverSummary,
  loading,
  showNotification,
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [showAllColumns, setShowAllColumns] = useState(false);
  const printRef = useRef();

  const summary = serverSummary ?? buildSummary(salesData);

  const toggleRow = (id) =>
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Quick Date Helpers ─────────────────────────────────────
  const getToday     = () => new Date().toISOString().split('T')[0];
  const getYesterday = () => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };
  const getThisWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(new Date().setDate(diff)).toISOString().split('T')[0];
  };
  const getThisMonthStart = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  const setPreset = useCallback((preset) => {
    const today = getToday();

    if (preset === 'today') {
      setReportType('daily');
      setReportDate(today);
      loadSalesReport({ type: 'daily', date: today });

    } else if (preset === 'yesterday') {
      const yest = getYesterday();
      setReportType('daily');
      setReportDate(yest);
      loadSalesReport({ type: 'daily', date: yest });

    } else if (preset === 'this-week') {
      const start = getThisWeekStart();
      setReportType('range');
      setReportStartDate(start);
      setReportEndDate(today);
      loadSalesReport({ type: 'range', startDate: start, endDate: today });

    } else if (preset === 'this-month') {
      const start = getThisMonthStart();
      setReportType('range');
      setReportStartDate(start);
      setReportEndDate(today);
      loadSalesReport({ type: 'range', startDate: start, endDate: today });
    }
  }, [loadSalesReport, setReportType, setReportDate, setReportStartDate, setReportEndDate]);

  // ── Pagination ──────────────────────────────────────────────
  const pagination = salesData?.data
    ? {
        currentPage: salesData.current_page || 1,
        lastPage:    salesData.last_page    || 1,
        total:       salesData.total        || 0,
        perPage:     salesData.per_page     || 50,
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
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 3mm; color: #000; }
            @media print { @page { size: 80mm auto; margin: 0; } body { padding: 3mm; } }
            .center { text-align: center; } .right { text-align: right; } .bold { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 1px 0; }
            th { text-align: left; padding: 2px 0; border-bottom: 1px solid #000; }
            .th-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center">
            <div style="font-weight:bold;font-size:16px;">ALQUIZALAS STORE</div>
            <div style="font-size:11px;">Toledo, Bato, Cebu</div>
            <div style="font-size:11px;">0917-XXX-XXXX</div>
          </div>
          <hr />
          <div class="center bold" style="font-size:13px;margin:4px 0;">SALES REPORT</div>
          <div class="center" style="font-size:11px;">${periodLabel}</div>
          <hr />
          ${content}
          <hr />
          <div class="center" style="font-size:11px;margin-top:6px;">
            <div>Printed: ${now}</div>
            <div style="margin-top:4px;font-size:10px;color:#666;">— Alquizalas Store —</div>
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
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Sales Reports
          </h2>
          <button
            onClick={() => loadSalesReport()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'today',      label: 'Today',      cls: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
            { key: 'yesterday',  label: 'Yesterday',  cls: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
            { key: 'this-week',  label: 'This Week',  cls: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
            { key: 'this-month', label: 'This Month', cls: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
          ].map(({ key, label, cls }) => (
            <button key={key} onClick={() => setPreset(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${cls}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="daily">Daily Report</option>
              <option value="range">Date Range</option>
            </select>
          </div>

          {reportType === 'daily' ? (
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Date</label>
              <input type="date" value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Start Date</label>
                <input type="date" value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">End Date</label>
                <input type="date" value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button onClick={() => loadSalesReport()} disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors text-sm active:scale-95">
              {loading
                ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Loading...</span>
                : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Summary Cards ═══ */}
      {summary && (
        <>
          {/* Badge shown when server summary is active (all-rows accurate) */}
          {serverSummary && pagination && pagination.total > pagination.perPage && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
              Totals cover all {pagination.total} transactions across {pagination.lastPage} pages.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: 'Total Sales', value: fmt(summary.totalSales),
                sub: `${summary.totalTransactions} transaction(s)`,
                icon: DollarSign, bg: 'bg-green-100', iconCls: 'text-green-600',
              },
              {
                label: 'Avg. Transaction', value: fmt(summary.averageTransaction),
                sub: 'per sale',
                icon: TrendingUp, bg: 'bg-purple-100', iconCls: 'text-purple-600',
              },
              {
                label: 'Payments Received', value: fmt(summary.paymentTotal),
                sub: `${summary.paymentTransactions} payment(s)`,
                icon: Wallet, bg: 'bg-teal-100', iconCls: 'text-teal-600', valCls: 'text-teal-600',
              },
              {
                label: 'Credit Sales', value: fmt(summary.creditSales),
                sub: summary.totalSales > 0
                  ? `${((summary.creditSales / summary.totalSales) * 100).toFixed(1)}% of total`
                  : '0% of total',
                icon: CreditCard, bg: 'bg-orange-100', iconCls: 'text-orange-600', valCls: 'text-orange-600',
              },
            ].map(({ label, value, sub, icon: Icon, bg, iconCls, valCls }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bg} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconCls}`} />
                  </div>
                </div>
                <p className={`text-lg sm:text-3xl font-bold ${valCls || 'text-gray-800'}`}>{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Payment Method Breakdown Bars */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-700 text-sm sm:text-base">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Payment Method Breakdown
            </h3>
            {summary.totalSales > 0 ? (
              <div className="space-y-4">
                {[
                  { label: 'Cash',           value: summary.cashSales,   color: 'bg-green-500',  icon: DollarSign,  textColor: 'text-green-600' },
                  { label: 'GCash',          value: summary.gcashSales,  color: 'bg-blue-500',   icon: Smartphone,  textColor: 'text-blue-600' },
                  { label: 'Credit (Utang)', value: summary.creditSales, color: 'bg-orange-500', icon: CreditCard,  textColor: 'text-orange-600' },
                ].map(({ label, value, color, icon: Icon, textColor }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${textColor}`} />
                        <span className="font-medium">{label}</span>
                      </span>
                      <span className={`font-semibold ${textColor}`}>{fmt(value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${summary.totalSales > 0 ? (value / summary.totalSales) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {summary.totalSales > 0 ? ((value / summary.totalSales) * 100).toFixed(1) : '0.0'}% of total
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

      {/* ═══ Analytics Charts ═══ */}
      {salesData?.data?.length > 0 && (() => {
        const salesOnly = salesData.data.filter(t => t.payment_method !== 'payment');

        // Daily trend (for date-range reports)
        const dailyMap = {};
        salesOnly.forEach(t => {
          const d = t.sale_date?.split('T')[0] || t.sale_date;
          dailyMap[d] = (dailyMap[d] || 0) + Math.abs(parseFloat(t.total_amount) || 0);
        });
        const dailyLabels = Object.keys(dailyMap).sort();
        const dailyValues = dailyLabels.map(d => parseFloat(dailyMap[d].toFixed(2)));
        const showDailyChart = reportType === 'range' && dailyLabels.length > 1;

        // Hourly breakdown
        const hourMap = {};
        for (let h = 0; h < 24; h++) hourMap[h] = 0;
        salesOnly.forEach(t => {
          const dt = new Date(t.sale_date);
          const h = dt.getHours();
          hourMap[h] += Math.abs(parseFloat(t.total_amount) || 0);
        });
        const hourLabels = Array.from({ length: 24 }, (_, h) =>
          h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
        );
        const hourValues = Array.from({ length: 24 }, (_, h) =>
          parseFloat((hourMap[h] || 0).toFixed(2))
        );
        const peakHour = hourValues.indexOf(Math.max(...hourValues));

        // Top products
        const productMap = {};
        salesOnly.forEach(t => {
          (t.sale_items || []).forEach(item => {
            const name = item.product_unit?.product?.name || 'Unknown';
            if (!productMap[name]) productMap[name] = { qty: 0, total: 0 };
            productMap[name].qty   += parseFloat(item.quantity) || 0;
            productMap[name].total += parseFloat(item.subtotal) || 0;
          });
        });
        const topProducts = Object.entries(productMap)
          .map(([name, v]) => ({ name, qty: v.qty, total: parseFloat(v.total.toFixed(2)) }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8);
        const maxProductTotal = topProducts[0]?.total || 1;

        return (
          <>
            {showDailyChart && (
              <DailyTrendChart dailyLabels={dailyLabels} dailyValues={dailyValues} fmt={fmt} />
            )}

            <HourlyChart hourLabels={hourLabels} hourValues={hourValues} peakHour={peakHour} fmt={fmt} />

            {topProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                  <ShoppingCart className="w-5 h-5 text-gray-500" />
                  Top selling products
                  {pagination && pagination.total > pagination.perPage && (
                    <span className="text-xs text-gray-400 font-normal ml-1">(page 1 of {pagination.lastPage})</span>
                  )}
                </h3>
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-800 truncate max-w-[120px] sm:max-w-[200px]">{p.name}</span>
                        </span>
                        <span className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-gray-400 text-xs">{p.qty} sold</span>
                          <span className="font-semibold text-gray-700">{fmt(p.total)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(p.total / maxProductTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* ═══ Print template (hidden) ═══ */}
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
                <tr><td>Payments Received</td><td className="right">{fmt(summary.paymentTotal)}</td></tr>
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
                  <th>Date</th><th>Customer</th>
                  <th className="th-right">Amount</th><th className="th-right">Items</th>
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
      {salesData?.data?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 sm:p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm sm:text-base">
              <FileText className="w-5 h-5 text-gray-500" />
              Sales & Payment Transactions
              {pagination && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
                  {pagination.total} total
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAllColumns(!showAllColumns)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 border rounded-lg">
                {showAllColumns ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showAllColumns ? 'Compact' : 'Show Items'}
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-6"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  {showAllColumns && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
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
                          {items.length > 0
                            ? isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {new Date(transaction.sale_date).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={transaction.customer ? 'text-gray-800' : 'text-gray-400 italic'}>
                            {transaction.customer?.name || 'Walk-in'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          <span className={isPayment ? 'text-teal-600' : 'text-gray-800'}>
                            {isPayment ? '−' : ''}{fmt(Math.abs(parseFloat(transaction.total_amount)))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            transaction.payment_method === 'cash'    ? 'bg-green-100 text-green-700' :
                            transaction.payment_method === 'gcash'   ? 'bg-blue-100 text-blue-700'  :
                            transaction.payment_method === 'credit'  ? 'bg-orange-100 text-orange-700' :
                            transaction.payment_method === 'payment' ? 'bg-teal-100 text-teal-700'  :
                                                                       'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.payment_method === 'payment'
                              ? 'PAYMENT'
                              : (transaction.payment_method || '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : '—'}
                        </td>
                        {showAllColumns && (
                          <td className="px-4 py-3 text-right text-sm">
                            {fmt(Math.abs(parseFloat(transaction.amount_paid || 0)))}
                          </td>
                        )}
                      </tr>

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
            <div className="px-3 sm:px-5 py-3 border-t bg-gray-50 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <div className="flex gap-2">
                <button disabled={pagination.currentPage <= 1}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs">
                  ← Prev
                </button>
                <button disabled={pagination.currentPage >= pagination.lastPage}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Table footer summary */}
          <div className="px-3 sm:px-5 py-3 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-8 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">Total Sales: </span>
                <span className="font-bold text-gray-800">{fmt(summary?.totalSales || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">Payments Received: </span>
                <span className="font-bold text-teal-600">{fmt(summary?.paymentTotal || 0)}</span>
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
      {salesData?.data?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-600">No Transactions Found</h3>
          <p className="text-gray-400 text-sm">No sales or payment transactions for the selected period.</p>
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
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-600">Generate Sales Report</h3>
          <p className="text-gray-400 text-sm">Select a date or date range and click "Generate Report"</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <RefreshCw className="w-10 h-10 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading report data...</p>
        </div>
      )}
    </div>
  );
};

export default ReportsInterface;