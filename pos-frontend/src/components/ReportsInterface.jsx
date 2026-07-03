import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, Smartphone,
  Wallet, AlertCircle, Printer, Calendar, ChevronDown, ChevronUp,
  FileText, BarChart3, RefreshCw, Eye, EyeOff, Download, Search, Users, X
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

// ── jsPDF + AutoTable loader (injected once, same pattern as Chart.js) ──
let jsPdfReady = false;
let jsPdfCallbacks = [];
const loadJsPdf = (cb) => {
  if (jsPdfReady) { cb(); return; }
  jsPdfCallbacks.push(cb);
  if (document.getElementById('jspdf-cdn')) return;
  const s1 = document.createElement('script');
  s1.id = 'jspdf-cdn';
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.0.0/jspdf.umd.min.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.id = 'jspdf-autotable-cdn';
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/5.0.2/jspdf.plugin.autotable.min.js';
    s2.onload = () => { jsPdfReady = true; jsPdfCallbacks.forEach(f => f()); jsPdfCallbacks = []; };
    s2.onerror = () => { jsPdfCallbacks = []; };
    document.head.appendChild(s2);
  };
  s1.onerror = () => { jsPdfCallbacks = []; };
  document.head.appendChild(s1);
};

// ── ExcelJS loader (injected once, same pattern as Chart.js / jsPDF) ──
let excelJsReady = false;
let excelJsCallbacks = [];
const loadExcelJs = (cb) => {
  if (excelJsReady) { cb(); return; }
  excelJsCallbacks.push(cb);
  if (document.getElementById('exceljs-cdn')) return;
  const s = document.createElement('script');
  s.id = 'exceljs-cdn';
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  s.onload = () => { excelJsReady = true; excelJsCallbacks.forEach(f => f()); excelJsCallbacks = []; };
  s.onerror = () => { excelJsCallbacks = []; };
  document.head.appendChild(s);
};

// ── Daily Trend Chart ──────────────────────────────────────────
const DailyTrendChart = React.memo(({ dailyLabels, dailyValues, fmt }) => {
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
              mode: 'index', // Faster tooltip rendering
              intersect: false,
              callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
            y: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { font: { size: 11 }, callback: v => '₱' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) },
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
          <TrendingUp className="w-5 h-5 text-gray-500" /> Daily sales trend
        </h3>
        {peak && <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">Peak: {peak}</span>}
      </div>
      <p className="text-xs text-gray-400 mb-4">{dailyLabels.length} days</p>
      <div style={{ position: 'relative', height: '220px' }}>
        <canvas ref={canvasRef} role="img" aria-label={`Line chart showing daily sales trend over ${dailyLabels.length} days`} />
      </div>
    </div>
  );
});

// ── Hourly Sales Chart ─────────────────────────────────────────
const HourlyChart = React.memo(({ hourLabels, hourValues, peakHour, fmt }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    loadChartJs(() => {
      if (!canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); }
      const bgColors = hourValues.map((_, i) => i === peakHour ? '#2563eb' : 'rgba(37,99,235,0.18)');
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: hourLabels,
          datasets: [{ label: 'Sales by hour', data: hourValues, backgroundColor: bgColors, borderRadius: 4, borderSkipped: false }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 0 } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, callback: v => v === 0 ? '' : '₱' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) } },
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
          <BarChart3 className="w-5 h-5 text-gray-500" /> Hourly sales
        </h3>
        <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">Peak: {hourLabels[peakHour]}</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">When are sales busiest?</p>
      <div style={{ position: 'relative', height: '200px' }}>
        <canvas ref={canvasRef} role="img" aria-label="Bar chart showing sales volume by hour of day" />
      </div>
    </div>
  );
});

const fmt = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

const buildSummary = (salesData) => {
  if (!salesData?.data?.length) return null;
  let cashSales = 0, gcashSales = 0, creditSales = 0, paymentTotal = 0, salesCount = 0, paymentCount = 0;
  for (const t of salesData.data) {
    const amount = Math.abs(parseFloat(t.total_amount) || 0);
    const method = (t.payment_method || '').toLowerCase();
    if (method === 'payment') { paymentTotal += amount; paymentCount += 1; } 
    else {
      salesCount += 1;
      if (method === 'cash') cashSales += amount;
      else if (method === 'gcash') gcashSales += amount;
      else if (method === 'credit') creditSales += amount;
      else cashSales += amount;
    }
  }
  const totalSales = cashSales + gcashSales + creditSales;
  return { totalSales, cashSales, gcashSales, creditSales, paymentTotal, totalTransactions: salesCount, paymentTransactions: paymentCount, averageTransaction: salesCount > 0 ? totalSales / salesCount : 0 };
};

const ReportsInterface = ({
  reportType, setReportType, reportDate, setReportDate, reportStartDate, setReportStartDate, reportEndDate, setReportEndDate,
  loadSalesReport, salesData, serverSummary, loading, showNotification,
  allProducts = [],
  previousPeriodSummary = null,
  previousPeriodLabel = '',
  onLoadPreviousPeriod = null,
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [printingFull, setPrintingFull] = useState(false);
  const [customerFilterInput, setCustomerFilterInput] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const printRef = useRef();
  const fullPrintRef = useRef();

  useEffect(() => {
    const t = setTimeout(() => setCustomerFilter(customerFilterInput.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [customerFilterInput]);

  const filteredTransactions = useMemo(() => {
    if (!salesData?.data) return [];
    if (!customerFilter) return salesData.data;
    return salesData.data.filter(t => (t.customer?.name || 'walk-in').toLowerCase().includes(customerFilter));
  }, [salesData, customerFilter]);

  const summary = useMemo(() => {
    if (customerFilter) return buildSummary({ data: filteredTransactions });
    return serverSummary ?? buildSummary(salesData);
  }, [customerFilter, filteredTransactions, serverSummary, salesData]);

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const getToday = () => new Date().toISOString().split('T')[0];
  const getYesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; };
  const getThisWeekStart = () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(new Date().setDate(diff)).toISOString().split('T')[0]; };
  const getThisMonthStart = () => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); return `${y}-${m}-01`; };

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const setPreset = useCallback((preset) => {
    const today = getToday();
    if (preset === 'today') { setReportType('daily'); setReportDate(today); loadSalesReport({ type: 'daily', date: today }); }
    else if (preset === 'yesterday') { const yest = getYesterday(); setReportType('daily'); setReportDate(yest); loadSalesReport({ type: 'daily', date: yest }); }
    else if (preset === 'this-week') { const start = getThisWeekStart(); setReportType('range'); setReportStartDate(start); setReportEndDate(today); loadSalesReport({ type: 'range', startDate: start, endDate: today }); }
    else if (preset === 'this-month') { const start = getThisMonthStart(); setReportType('range'); setReportStartDate(start); setReportEndDate(today); loadSalesReport({ type: 'range', startDate: start, endDate: today }); }
  }, [loadSalesReport, setReportType, setReportDate, setReportStartDate, setReportEndDate]);

  const pagination = salesData?.data ? { currentPage: salesData.current_page || 1, lastPage: salesData.last_page || 1, total: salesData.total || 0, perPage: salesData.per_page || 50 } : null;

  const analyticsData = useMemo(() => {
    if (!filteredTransactions?.length) return null;
    const salesOnly = filteredTransactions.filter(t => t.payment_method !== 'payment');
    
    const dailyMap = {}; salesOnly.forEach(t => { const d = t.sale_date?.split('T')[0] || t.sale_date; dailyMap[d] = (dailyMap[d] || 0) + Math.abs(parseFloat(t.total_amount) || 0); });
    const dailyLabels = Object.keys(dailyMap).sort();
    const dailyValues = dailyLabels.map(d => parseFloat(dailyMap[d].toFixed(2)));
    
    const hourMap = {}; for (let h = 0; h < 24; h++) hourMap[h] = 0; salesOnly.forEach(t => { hourMap[new Date(t.sale_date).getHours()] += Math.abs(parseFloat(t.total_amount) || 0); });
    const hourLabels = Array.from({ length: 24 }, (_, h) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);
    const hourValues = Array.from({ length: 24 }, (_, h) => parseFloat((hourMap[h] || 0).toFixed(2)));
    
    const productMap = {}; salesOnly.forEach(t => { (t.sale_items || []).forEach(item => { const name = item.product_unit?.product?.name || 'Unknown'; if (!productMap[name]) productMap[name] = { qty: 0, total: 0 }; productMap[name].qty += parseFloat(item.quantity) || 0; productMap[name].total += parseFloat(item.subtotal) || 0; }); });
    const topProducts = Object.entries(productMap).map(([name, v]) => ({ name, qty: v.qty, total: parseFloat(v.total.toFixed(2)) })).sort((a, b) => b.total - a.total).slice(0, 8);

    return { dailyLabels, dailyValues, hourLabels, hourValues, topProducts, productMap };
  }, [filteredTransactions]);

  const deadStockData = useMemo(() => {
    if (!analyticsData) return null;
    const soldNames = new Set(Object.keys(analyticsData.productMap || {}));
    if (allProducts && allProducts.length > 0) {
      const trueDead = allProducts.filter(p => !soldNames.has(p.name));
      return { mode: 'full', items: trueDead };
    }
    const lowSellers = Object.entries(analyticsData.productMap || {})
      .map(([name, v]) => ({ name, qty: v.qty, total: parseFloat(v.total.toFixed(2)) }))
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 10);
    return { mode: 'lowSellers', items: lowSellers };
  }, [analyticsData, allProducts]);

  const visibleTransactions = filteredTransactions.slice(0, 50);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) { alert('No transactions to export!'); return; }
    const headers = ['Transaction ID', 'Date & Time', 'Customer', 'Payment Method', 'Total Amount', 'Amount Paid', 'Items Breakdown'];
    const rows = filteredTransactions.map(t => {
      const date = new Date(t.sale_date).toLocaleString('en-PH');
      const customer = t.customer?.name || 'Walk-in';
      const method = t.payment_method === 'payment' ? 'PAYMENT' : t.payment_method.toUpperCase();
      const total = Math.abs(parseFloat(t.total_amount || 0)).toFixed(2);
      const paid = Math.abs(parseFloat(t.amount_paid || 0)).toFixed(2);
      let itemsString = '';
      if (t.sale_items && t.sale_items.length > 0) {
        itemsString = t.sale_items.map(item => `${item.product_unit?.product?.name || 'Product'} (${item.product_unit?.unit_name}) x${item.quantity} @ ${parseFloat(item.subtotal).toFixed(2)}`).join('; ');
      }
      return [t.id, `"${date}"`, `"${customer}"`, `"${method}"`, total, paid, `"${itemsString}"`].join(',');
    });
    let summaryRows = [];
    if (summary) {
      summaryRows.push(''); summaryRows.push(`"--- SUMMARY ---"`);
      summaryRows.push(`"Total Sales","${summary.totalSales.toFixed(2)}"`); summaryRows.push(`"Total Transactions","${summary.totalTransactions}"`);
      summaryRows.push(`"Average Transaction","${summary.averageTransaction.toFixed(2)}"`); summaryRows.push(`"Cash Sales","${summary.cashSales.toFixed(2)}"`);
      summaryRows.push(`"GCash Sales","${summary.gcashSales.toFixed(2)}"`); summaryRows.push(`"Credit (Utang) Sales","${summary.creditSales.toFixed(2)}"`);
      summaryRows.push(`"Payments Received","${summary.paymentTotal.toFixed(2)}"`);
    }
    const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const periodLabel = reportType === 'daily' ? reportDate : `${reportStartDate}_to_${reportEndDate}`;
    const fileSuffix = customerFilter ? `_${customerFilterInput.trim().replace(/\s+/g, '_')}` : '';
    link.setAttribute('download', `sales_report_${periodLabel}${fileSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) { alert('No transactions to export!'); return; }
    setExportingExcel(true);
    loadExcelJs(async () => {
      try {
        const workbook = new window.ExcelJS.Workbook();
        workbook.creator = 'Alquizalas Store POS';
        workbook.created = new Date();

        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [{ width: 26 }, { width: 20 }];
        const periodLabel = reportType === 'daily' ? `Date: ${reportDate}` : `From: ${reportStartDate}  To: ${reportEndDate}`;
        summarySheet.mergeCells('A1:B1');
        summarySheet.getCell('A1').value = 'ALQUIZALAS STORE — SALES REPORT';
        summarySheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };
        summarySheet.mergeCells('A2:B2');
        summarySheet.getCell('A2').value = periodLabel + (customerFilter ? ` — Customer filter: "${customerFilterInput.trim()}"` : '');
        summarySheet.getCell('A2').alignment = { horizontal: 'center' };
        summarySheet.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } };

        if (summary) {
          const summaryRows = [
            ['Total Sales', summary.totalSales],
            ['Total Transactions', summary.totalTransactions],
            ['Average Transaction', summary.averageTransaction],
            ['Cash Sales', summary.cashSales],
            ['GCash Sales', summary.gcashSales],
            ['Credit (Utang) Sales', summary.creditSales],
            ['Payments Received', summary.paymentTotal],
          ];
          let r = 4;
          summaryRows.forEach(([label, value]) => {
            summarySheet.getCell(`A${r}`).value = label;
            summarySheet.getCell(`A${r}`).font = { bold: true };
            summarySheet.getCell(`B${r}`).value = typeof value === 'number' && label !== 'Total Transactions' ? value : value;
            if (label !== 'Total Transactions') summarySheet.getCell(`B${r}`).numFmt = '"₱"#,##0.00';
            summarySheet.getCell(`B${r}`).alignment = { horizontal: 'right' };
            r++;
          });
          summarySheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          summarySheet.getCell('B4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        }

        if (analyticsData?.topProducts?.length > 0) {
          const prodSheet = workbook.addWorksheet('Top Products');
          prodSheet.columns = [{ width: 6 }, { width: 32 }, { width: 12 }, { width: 16 }];
          const headerRow = prodSheet.addRow(['#', 'Product', 'Qty Sold', 'Total']);
          headerRow.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; });
          analyticsData.topProducts.forEach((p, i) => {
            const row = prodSheet.addRow([i + 1, p.name, p.qty, p.total]);
            row.getCell(4).numFmt = '"₱"#,##0.00';
            row.getCell(4).alignment = { horizontal: 'right' };
            if (i % 2 === 1) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; });
          });
        }

        const txSheet = workbook.addWorksheet('Transactions');
        txSheet.columns = [
          { header: 'Date & Time', key: 'date', width: 20 },
          { header: 'Customer', key: 'customer', width: 22 },
          { header: 'Payment Method', key: 'method', width: 16 },
          { header: 'Total Amount', key: 'amount', width: 16 },
          { header: 'Amount Paid', key: 'paid', width: 16 },
          { header: 'Items', key: 'items', width: 40 },
        ];
        const txHeaderRow = txSheet.getRow(1);
        txHeaderRow.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; });

        filteredTransactions.forEach((t, i) => {
          const items = (t.sale_items || []).map(item => `${item.product_unit?.product?.name || 'Product'} x${item.quantity}`).join(', ');
          const row = txSheet.addRow({
            date: new Date(t.sale_date).toLocaleString('en-PH'),
            customer: t.customer?.name || 'Walk-in',
            method: t.payment_method === 'payment' ? 'PAYMENT' : (t.payment_method || '').toUpperCase(),
            amount: Math.abs(parseFloat(t.total_amount || 0)),
            paid: Math.abs(parseFloat(t.amount_paid || 0)),
            items,
          });
          row.getCell('amount').numFmt = '"₱"#,##0.00';
          row.getCell('paid').numFmt = '"₱"#,##0.00';
          row.getCell('amount').alignment = { horizontal: 'right' };
          row.getCell('paid').alignment = { horizontal: 'right' };
          if (i % 2 === 1) row.eachCell(c => { if (!c.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; });
        });

        if (summary) {
          const totalRowNum = txSheet.rowCount + 2;
          txSheet.getCell(`A${totalRowNum}`).value = 'TOTAL';
          txSheet.getCell(`A${totalRowNum}`).font = { bold: true };
          txSheet.getCell(`D${totalRowNum}`).value = summary.totalSales;
          txSheet.getCell(`D${totalRowNum}`).numFmt = '"₱"#,##0.00';
          txSheet.getCell(`D${totalRowNum}`).font = { bold: true };
          txSheet.getRow(totalRowNum).eachCell(c => { c.border = { top: { style: 'thin' } }; });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const periodFile = reportType === 'daily' ? reportDate : `${reportStartDate}_to_${reportEndDate}`;
        const fileSuffix = customerFilter ? `_${customerFilterInput.trim().replace(/\s+/g, '_')}` : '';
        link.href = url;
        link.download = `sales_report_${periodFile}${fileSuffix}.xlsx`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Excel export error:', err);
        alert('Failed to generate Excel file. Please try again.');
      } finally {
        setExportingExcel(false);
      }
    });
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) { alert('No transactions to export!'); return; }
    setExportingPDF(true);
    loadJsPdf(() => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 40;
        let y = 42;

        const periodLabel = reportType === 'daily' ? `Date: ${reportDate}` : `From: ${reportStartDate}  To: ${reportEndDate}`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ALQUIZALAS STORE', pageWidth / 2, y, { align: 'center' });
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text('Toledo, Bato, Cebu', pageWidth / 2, y, { align: 'center' });
        y += 22;
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('SALES REPORT', pageWidth / 2, y, { align: 'center' });
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(periodLabel, pageWidth / 2, y, { align: 'center' });
        y += 12;
        doc.setDrawColor(210);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 18;

        if (summary) {
          doc.autoTable({
            startY: y,
            margin: { left: marginX, right: marginX },
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2.5 },
            body: [
              ['Total Sales', fmt(summary.totalSales)],
              ['Total Transactions', String(summary.totalTransactions)],
              ['Average Transaction', fmt(summary.averageTransaction)],
              ['Cash Sales', fmt(summary.cashSales)],
              ['GCash Sales', fmt(summary.gcashSales)],
              ['Credit (Utang) Sales', fmt(summary.creditSales)],
              ['Payments Received', fmt(summary.paymentTotal)],
            ],
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 190 }, 1: { halign: 'right' } },
          });
          y = doc.lastAutoTable.finalY + 22;
        }

        if (analyticsData?.topProducts?.length > 0) {
          if (y > pageHeight - 120) { doc.addPage(); y = 42; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(0);
          doc.text('Top Selling Products', marginX, y);
          y += 8;
          doc.autoTable({
            startY: y,
            margin: { left: marginX, right: marginX },
            head: [['#', 'Product', 'Qty Sold', 'Total']],
            body: analyticsData.topProducts.map((p, i) => [i + 1, p.name, p.qty, fmt(p.total)]),
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 0: { cellWidth: 24 }, 2: { halign: 'right' }, 3: { halign: 'right' } },
          });
          y = doc.lastAutoTable.finalY + 22;
        }

        if (y > pageHeight - 120) { doc.addPage(); y = 42; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Transactions (${filteredTransactions.length})`, marginX, y);
        y += 8;

        const txRows = filteredTransactions.map(t => {
          const date = new Date(t.sale_date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const customer = t.customer?.name || 'Walk-in';
          const method = t.payment_method === 'payment' ? 'PAYMENT' : (t.payment_method || '').toUpperCase();
          const amount = (t.payment_method === 'payment' ? '-' : '') + fmt(Math.abs(parseFloat(t.total_amount)));
          const items = t.sale_items?.length || 0;
          return [date, customer, method, amount, items];
        });

        doc.autoTable({
          startY: y,
          margin: { left: marginX, right: marginX, bottom: 40 },
          head: [['Date', 'Customer', 'Method', 'Amount', 'Items']],
          body: txRows,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: { 3: { halign: 'right' }, 4: { halign: 'center' } },
          didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${data.pageNumber}`, pageWidth - marginX, pageHeight - 20, { align: 'right' });
          },
        });

        const now = new Date().toLocaleString('en-PH');
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated: ${now}`, marginX, pageHeight - 20);

        const periodFile = reportType === 'daily' ? reportDate : `${reportStartDate}_to_${reportEndDate}`;
        const fileSuffix = customerFilter ? `_${customerFilterInput.trim().replace(/\s+/g, '_')}` : '';
        doc.save(`sales_report_${periodFile}${fileSuffix}.pdf`);
      } catch (err) {
        console.error('PDF export error:', err);
        alert('Failed to generate PDF. Please try again.');
      } finally {
        setExportingPDF(false);
      }
    });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const now = new Date().toLocaleString('en-PH');
    const periodLabel = reportType === 'daily' ? `Date: ${reportDate}` : `From: ${reportStartDate}  To: ${reportEndDate}`;
    const win = window.open('', '_blank', 'width=500,height=700');
    win.document.write(`<html><head><title>Sales Report - Alquizalas Store</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 3mm; color: #000; } @media print { @page { size: 80mm auto; margin: 0; } body { padding: 3mm; } } .center { text-align: center; } .right { text-align: right; } .bold { font-weight: bold; } hr { border: none; border-top: 1px dashed #000; margin: 4px 0; } table { width: 100%; border-collapse: collapse; } td { vertical-align: top; padding: 1px 0; } th { text-align: left; padding: 2px 0; border-bottom: 1px solid #000; } .th-right { text-align: right; }</style></head><body><div class="center"><div style="font-weight:bold;font-size:16px;">ALQUIZALAS STORE</div><div style="font-size:11px;">Toledo, Bato, Cebu</div><div style="font-size:11px;">0917-XXX-XXXX</div></div><hr /><div class="center bold" style="font-size:13px;margin:4px 0;">SALES REPORT</div><div class="center" style="font-size:11px;">${periodLabel}</div><hr />${content}<hr /><div class="center" style="font-size:11px;margin-top:6px;"><div>Printed: ${now}</div><div style="margin-top:4px;font-size:10px;color:#666;">— Alquizalas Store —</div></div></body></html>`);
    win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 350);
  };

  const handlePrintFullReport = () => {
    if (!summary && filteredTransactions.length === 0) { alert('No data to print!'); return; }
    setPrintingFull(true);
    try {
      const now = new Date().toLocaleString('en-PH');
      const periodLabel = reportType === 'daily' ? `Date: ${reportDate}` : `From: ${reportStartDate}  To: ${reportEndDate}`;

      const summaryRowsHtml = summary ? `
        <table class="kv">
          <tr><td>Total Sales</td><td class="right bold">${fmt(summary.totalSales)}</td></tr>
          <tr><td>Total Transactions</td><td class="right">${summary.totalTransactions}</td></tr>
          <tr><td>Average Transaction</td><td class="right">${fmt(summary.averageTransaction)}</td></tr>
          <tr><td>Cash Sales</td><td class="right">${fmt(summary.cashSales)}</td></tr>
          <tr><td>GCash Sales</td><td class="right">${fmt(summary.gcashSales)}</td></tr>
          <tr><td>Credit (Utang) Sales</td><td class="right">${fmt(summary.creditSales)}</td></tr>
          <tr><td>Payments Received</td><td class="right">${fmt(summary.paymentTotal)}</td></tr>
        </table>` : '';

      const topProductsHtml = analyticsData?.topProducts?.length > 0 ? `
        <h3>Top Selling Products</h3>
        <table class="grid">
          <thead><tr><th>#</th><th>Product</th><th class="right">Qty Sold</th><th class="right">Total</th></tr></thead>
          <tbody>${analyticsData.topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td class="right">${p.qty}</td><td class="right">${fmt(p.total)}</td></tr>`).join('')}</tbody>
        </table>` : '';

      const deadStockHtml = deadStockData && deadStockData.items.length > 0 ? `
        <h3>${deadStockData.mode === 'full' ? 'Dead Stock (Zero Sales This Period)' : 'Lowest-Moving Products This Period'}</h3>
        ${deadStockData.mode === 'lowSellers' ? '<p class="note">Note: no product catalog was supplied, so this shows the lowest sellers among items that did sell, not literal zero-sale products.</p>' : ''}
        <table class="grid">
          <thead><tr><th>Product</th>${deadStockData.mode === 'lowSellers' ? '<th class="right">Qty Sold</th>' : ''}</tr></thead>
          <tbody>${deadStockData.items.map(p => `<tr><td>${p.name}</td>${deadStockData.mode === 'lowSellers' ? `<td class="right">${p.qty}</td>` : ''}</tr>`).join('')}</tbody>
        </table>` : '';

      const txHtml = filteredTransactions.length > 0 ? `
        <h3>Transactions (${filteredTransactions.length})${customerFilter ? ` — filtered: "${customerFilterInput.trim()}"` : ''}</h3>
        <table class="grid">
          <thead><tr><th>Date</th><th>Customer</th><th>Method</th><th class="right">Amount</th><th class="right">Items</th></tr></thead>
          <tbody>${filteredTransactions.map(t => `<tr><td>${new Date(t.sale_date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${t.customer?.name || 'Walk-in'}</td><td>${t.payment_method === 'payment' ? 'PAYMENT' : (t.payment_method || '').toUpperCase()}</td><td class="right">${t.payment_method === 'payment' ? '-' : ''}${fmt(Math.abs(parseFloat(t.total_amount)))}</td><td class="right">${t.sale_items?.length || 0}</td></tr>`).join('')}</tbody>
        </table>` : '';

      const win = window.open('', '_blank', 'width=850,height=1100');
      win.document.write(`<html><head><title>Sales Report - Alquizalas Store</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; padding: 24mm 18mm; font-size: 11px; }
        @media print { @page { size: A4; margin: 12mm; } }
        .letterhead { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 16px; }
        .letterhead h1 { font-size: 20px; color: #2563eb; letter-spacing: 1px; }
        .letterhead p { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .meta { text-align: center; margin-bottom: 20px; }
        .meta .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
        .meta .period { font-size: 11px; color: #4b5563; }
        h3 { font-size: 12px; margin: 18px 0 8px; color: #1f2937; border-left: 3px solid #2563eb; padding-left: 6px; }
        table.kv { width: 50%; border-collapse: collapse; margin-bottom: 6px; }
        table.kv td { padding: 4px 6px; font-size: 11px; }
        table.kv tr:nth-child(1) td { background: #dcfce7; }
        table.grid { width: 100%; border-collapse: collapse; font-size: 10px; }
        table.grid th { background: #2563eb; color: #fff; text-align: left; padding: 5px 6px; }
        table.grid td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; }
        table.grid tr:nth-child(even) td { background: #f9fafb; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .note { font-size: 9px; color: #9ca3af; font-style: italic; margin-bottom: 6px; }
        .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }
      </style></head><body>
        <div class="letterhead"><h1>ALQUIZALAS STORE</h1><p>Toledo, Bato, Cebu &nbsp;•&nbsp; 0917-XXX-XXXX</p></div>
        <div class="meta"><div class="title">SALES REPORT</div><div class="period">${periodLabel}</div></div>
        ${summaryRowsHtml}
        ${topProductsHtml}
        ${deadStockHtml}
        ${txHtml}
        <div class="footer">Generated ${now} — Alquizalas Store</div>
      </body></html>`);
      win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 400);
    } catch (err) {
      console.error('Full report print error:', err);
      alert('Failed to build the printable report.');
    } finally {
      setPrintingFull(false);
    }
  };

  const handleCompare = async () => {
    if (!onLoadPreviousPeriod) return;
    setLoadingComparison(true);
    try {
      await onLoadPreviousPeriod({ reportType, reportDate, reportStartDate, reportEndDate });
      setShowComparison(true);
    } catch (err) {
      console.error('Comparison load error:', err);
      alert('Failed to load the previous period for comparison.');
    } finally {
      setLoadingComparison(false);
    }
  };

  const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-4 max-w-sm w-full">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-800 text-lg">Loading Report...</p>
              <p className="text-sm text-gray-500">Fetching large amounts of data. Please wait.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /> Sales Reports</h2>
          <button onClick={() => loadSalesReport()} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'today', label: 'Today', cls: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
            { key: 'yesterday', label: 'Yesterday', cls: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
            { key: 'this-week', label: 'This Week', cls: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
            { key: 'this-month', label: 'This Month', cls: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
          ].map(({ key, label, cls }) => (
            <button key={key} onClick={() => setPreset(key)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${cls}`}>{label}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
              <option value="daily">Daily Report</option>
              <option value="range">Date Range</option>
            </select>
          </div>
          {reportType === 'daily' ? (
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Date</label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Start Date</label>
                <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">End Date</label>
                <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </>
          )}
          <div className="flex items-end">
            <button onClick={() => loadSalesReport()} disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors text-sm active:scale-95">
              {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Loading...</span> : 'Generate Report'}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Quick Select Full Year:</label>
          <select
            onChange={(e) => {
              if (!e.target.value) return;
              const year = e.target.value;
              setReportType('range');
              setReportStartDate(`${year}-01-01`);
              setReportEndDate(`${year}-12-31`);
              loadSalesReport({ type: 'range', startDate: `${year}-01-01`, endDate: `${year}-12-31` });
              e.target.value = "";
            }}
            className="w-full sm:w-auto px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">Select a Year...</option>
            {availableYears.map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 hidden sm:inline">(Loads Jan 1 to Dec 31 instantly)</span>
        </div>
      </div>

      {summary && (
        <>
          {serverSummary && pagination && pagination.total > pagination.perPage && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" /> Totals cover all {pagination.total} transactions across {pagination.lastPage} pages.
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Sales', value: fmt(summary.totalSales), sub: `${summary.totalTransactions} transaction(s)`, icon: DollarSign, bg: 'bg-green-100', iconCls: 'text-green-600' },
              { label: 'Avg. Transaction', value: fmt(summary.averageTransaction), sub: 'per sale', icon: TrendingUp, bg: 'bg-purple-100', iconCls: 'text-purple-600' },
              { label: 'Payments Received', value: fmt(summary.paymentTotal), sub: `${summary.paymentTransactions} payment(s)`, icon: Wallet, bg: 'bg-teal-100', iconCls: 'text-teal-600', valCls: 'text-teal-600' },
              { label: 'Credit Sales', value: fmt(summary.creditSales), sub: summary.totalSales > 0 ? `${((summary.creditSales / summary.totalSales) * 100).toFixed(1)}% of total` : '0% of total', icon: CreditCard, bg: 'bg-orange-100', iconCls: 'text-orange-600', valCls: 'text-orange-600' },
            ].map(({ label, value, sub, icon: Icon, bg, iconCls, valCls }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bg} rounded-full flex items-center justify-center`}><Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconCls}`} /></div>
                </div>
                <p className={`text-lg sm:text-3xl font-bold ${valCls || 'text-gray-800'}`}>{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-700 text-sm sm:text-base"><BarChart3 className="w-5 h-5 text-gray-500" /> Payment Method Breakdown</h3>
            {summary.totalSales > 0 ? (
              <div className="space-y-4">
                {[
                  { label: 'Cash', value: summary.cashSales, color: 'bg-green-500', icon: DollarSign, textColor: 'text-green-600' },
                  { label: 'GCash', value: summary.gcashSales, color: 'bg-blue-500', icon: Smartphone, textColor: 'text-blue-600' },
                  { label: 'Credit (Utang)', value: summary.creditSales, color: 'bg-orange-500', icon: CreditCard, textColor: 'text-orange-600' },
                ].map(({ label, value, color, icon: Icon, textColor }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5"><Icon className={`w-4 h-4 ${textColor}`} /><span className="font-medium">{label}</span></span>
                      <span className={`font-semibold ${textColor}`}>{fmt(value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${summary.totalSales > 0 ? (value / summary.totalSales) * 100 : 0}%` }} /></div>
                    <p className="text-xs text-gray-400 mt-0.5">{summary.totalSales > 0 ? ((value / summary.totalSales) * 100).toFixed(1) : '0.0'}% of total</p>
                  </div>
                ))}
              </div>
            ) : ( <p className="text-sm text-gray-400 text-center py-3">No sales data to show breakdown.</p> )} 
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                <TrendingUp className="w-5 h-5 text-gray-500" /> Compare with previous period
              </h3>
              {!showComparison && (
                <button
                  onClick={handleCompare}
                  disabled={!onLoadPreviousPeriod || loadingComparison}
                  title={!onLoadPreviousPeriod ? 'Not wired up yet — pass onLoadPreviousPeriod from the parent to enable this' : ''}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingComparison ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null} {loadingComparison ? 'Loading...' : 'Compare'}
                </button>
              )}
            </div>
            {!onLoadPreviousPeriod && !showComparison && (
              <p className="text-xs text-gray-400 mt-2">Connect a previous-period data source in the parent component to enable this.</p>
            )}
            {showComparison && previousPeriodSummary && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Sales', curr: summary.totalSales, prev: previousPeriodSummary.totalSales, isMoney: true },
                  { label: 'Transactions', curr: summary.totalTransactions, prev: previousPeriodSummary.totalTransactions, isMoney: false },
                  { label: 'Avg. Transaction', curr: summary.averageTransaction, prev: previousPeriodSummary.averageTransaction, isMoney: true },
                ].map(({ label, curr, prev, isMoney }) => {
                  const pct = pctChange(curr, prev);
                  const up = pct >= 0;
                  return (
                    <div key={label} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-lg font-bold text-gray-800">{isMoney ? fmt(curr) : curr}</p>
                      <div className={`flex items-center gap-1 text-xs mt-1 ${up ? 'text-green-600' : 'text-red-600'}`}>
                        {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(pct).toFixed(1)}% vs {previousPeriodLabel || 'previous period'}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">was {isMoney ? fmt(prev) : prev}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {analyticsData && (
        <>
          {analyticsData.dailyLabels.length > 1 && reportType === 'range' && (
            <DailyTrendChart dailyLabels={analyticsData.dailyLabels} dailyValues={analyticsData.dailyValues} fmt={fmt} />
          )}
          <HourlyChart hourLabels={analyticsData.hourLabels} hourValues={analyticsData.hourValues} peakHour={analyticsData.hourValues.indexOf(Math.max(...analyticsData.hourValues))} fmt={fmt} />
          {analyticsData.topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                <ShoppingCart className="w-5 h-5 text-gray-500" /> Top selling products
              </h3>
              <div className="space-y-3">
                {analyticsData.topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="font-medium text-gray-800 truncate max-w-[120px] sm:max-w-[200px]">{p.name}</span>
                      </span>
                      <span className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-gray-400 text-xs">{p.qty} sold</span>
                        <span className="font-semibold text-gray-700">{fmt(p.total)}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(p.total / (analyticsData.topProducts[0]?.total || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deadStockData && deadStockData.items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
              <h3 className="font-semibold mb-1 flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-gray-500" />
                {deadStockData.mode === 'full' ? 'Dead Stock (Zero Sales This Period)' : 'Lowest-Moving Products This Period'}
              </h3>
              {deadStockData.mode === 'lowSellers' && (
                <p className="text-xs text-gray-400 mb-3">No product catalog supplied — showing lowest sellers among items that did sell. Pass an <code className="bg-gray-100 px-1 rounded">allProducts</code> prop for true zero-sale detection.</p>
              )}
              {deadStockData.mode === 'full' && (
                <p className="text-xs text-gray-400 mb-3">{deadStockData.items.length} product(s) had no sales in this period.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {deadStockData.items.map(p => (
                  <span key={p.name} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1">
                    {p.name}{deadStockData.mode === 'lowSellers' ? ` — ${p.qty} sold` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div ref={printRef} style={{ display: 'none' }}>
        {summary && (
          <>
            <table><tbody><tr><td>Total Sales</td><td className="right bold">{fmt(summary.totalSales)}</td></tr><tr><td>Transactions</td><td className="right">{summary.totalTransactions}</td></tr><tr><td>Avg. Transaction</td><td className="right">{fmt(summary.averageTransaction)}</td></tr></tbody></table>
            <hr /><table><tbody><tr><td>Cash</td><td className="right">{fmt(summary.cashSales)}</td></tr><tr><td>GCash</td><td className="right">{fmt(summary.gcashSales)}</td></tr><tr><td>Credit (Utang)</td><td className="right">{fmt(summary.creditSales)}</td></tr><tr><td>Payments Received</td><td className="right">{fmt(summary.paymentTotal)}</td></tr></tbody></table>
          </>
        )}
        {filteredTransactions.length > 0 && (
          <>
            <hr /><div className="center bold" style={{ fontSize: '11px', margin: '4px 0' }}>TRANSACTIONS</div>
            <table><thead><tr><th>Date</th><th>Customer</th><th className="th-right">Amount</th><th className="th-right">Items</th></tr></thead><tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id}><td style={{ fontSize: '10px' }}>{new Date(t.sale_date).toLocaleDateString('en-PH')}</td><td style={{ fontSize: '10px' }}>{t.customer?.name || 'Walk-in'}</td><td className="right" style={{ fontSize: '10px' }}>{t.payment_method === 'payment' ? '-' : ''}{fmt(Math.abs(parseFloat(t.total_amount)))}</td><td className="right" style={{ fontSize: '10px' }}>{t.sale_items?.length || 0}</td></tr>
              ))}
            </tbody></table>
          </>
        )}
      </div>

      {salesData?.data?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 sm:p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="font-semibold flex items-center gap-2 text-gray-700 text-sm sm:text-base">
              <FileText className="w-5 h-5 text-gray-500" /> Sales & Payment Transactions
              {pagination && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">{pagination.total} total</span>}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowAllColumns(!showAllColumns)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 border rounded-lg">
                {showAllColumns ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showAllColumns ? 'Compact' : 'Show Items'}
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors" title="Download as Excel/CSV">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={handleExportPDF} disabled={exportingPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Download as PDF">
                {exportingPDF ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} {exportingPDF ? 'Generating...' : 'PDF'}
              </button>
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          {/* ── MOBILE-FRIENDLY CARD VIEW (sm and below) ── */}
          <div className="sm:hidden divide-y divide-gray-100">
            {visibleTransactions.map((transaction) => {
              const isPayment = transaction.payment_method === 'payment';
              const isExpanded = expandedRows[transaction.id];
              const items = transaction.sale_items || [];
              return (
                <div key={transaction.id} className={`p-3 ${isPayment ? 'bg-green-50/30' : ''}`}>
                  <div
                    className="cursor-pointer"
                    onClick={() => items.length > 0 && toggleRow(transaction.id)}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {transaction.customer?.name || 'Walk-in'}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {new Date(transaction.sale_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className={`text-sm font-bold flex-shrink-0 ${isPayment ? 'text-teal-600' : 'text-gray-800'}`}>
                        {isPayment ? '−' : ''}{fmt(Math.abs(parseFloat(transaction.total_amount)))}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${transaction.payment_method === 'cash' ? 'bg-green-100 text-green-700' : transaction.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' : transaction.payment_method === 'credit' ? 'bg-orange-100 text-orange-700' : transaction.payment_method === 'payment' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700'}`}>
                        {transaction.payment_method === 'payment' ? 'PAYMENT' : (transaction.payment_method || '').toUpperCase()}
                      </span>
                      {items.length > 0 && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          {items.length} item{items.length > 1 ? 's' : ''}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                      )}
                      {items.length === 0 && (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  {isExpanded && items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs gap-2">
                          <span className="text-gray-700 min-w-0 flex-1">
                            <span className="font-medium">{item.product_unit?.product?.name || 'Product'}</span>
                            <span className="text-gray-400 ml-1">({item.product_unit?.unit_name}) × {item.quantity}</span>
                          </span>
                          <span className="font-semibold text-gray-600 flex-shrink-0">{fmt(parseFloat(item.subtotal))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs pt-2 border-t border-gray-200 mt-2">
                        <span className="font-medium text-gray-600">Transaction Total</span>
                        <span className="font-bold text-gray-800">{fmt(Math.abs(parseFloat(transaction.total_amount)))}</span>
                      </div>
                      {showAllColumns && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Amount Paid</span>
                          <span className="font-medium text-gray-700">{fmt(Math.abs(parseFloat(transaction.amount_paid || 0)))}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── DESKTOP TABLE VIEW (sm and up) ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-6"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  {showAllColumns && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTransactions.map((transaction) => {
                  const isPayment = transaction.payment_method === 'payment';
                  const isExpanded = expandedRows[transaction.id];
                  const items = transaction.sale_items || [];
                  return (
                    <React.Fragment key={transaction.id}>
                      <tr className={`hover:bg-gray-50 cursor-pointer transition-colors ${isPayment ? 'bg-green-50/30' : ''}`} onClick={() => items.length > 0 && toggleRow(transaction.id)}>
                        <td className="px-4 py-3 text-gray-300 text-sm text-center w-6">{items.length > 0 ? isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" /> : '—'}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{new Date(transaction.sale_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 text-sm"><span className={transaction.customer ? 'text-gray-800' : 'text-gray-400 italic'}>{transaction.customer?.name || 'Walk-in'}</span></td>
                        <td className="px-4 py-3 text-right text-sm font-semibold"><span className={isPayment ? 'text-teal-600' : 'text-gray-800'}>{isPayment ? '−' : ''}{fmt(Math.abs(parseFloat(transaction.total_amount)))}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${transaction.payment_method === 'cash' ? 'bg-green-100 text-green-700' : transaction.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' : transaction.payment_method === 'credit' ? 'bg-orange-100 text-orange-700' : transaction.payment_method === 'payment' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700'}`}>{transaction.payment_method === 'payment' ? 'PAYMENT' : (transaction.payment_method || '').toUpperCase()}</span></td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">{items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : '—'}</td>
                        {showAllColumns && <td className="px-4 py-3 text-right text-sm">{fmt(Math.abs(parseFloat(transaction.amount_paid || 0)))}</td>}
                      </tr>
                      {isExpanded && items.length > 0 && (
                        <tr className="bg-gray-50"><td colSpan={showAllColumns ? 7 : 6} className="px-4 py-3"><div className="ml-6 space-y-1">{items.map((item, idx) => (<div key={idx} className="flex items-center justify-between text-sm"><span className="text-gray-700"><span className="font-medium">{item.product_unit?.product?.name || 'Product'}</span><span className="text-gray-400 ml-2">({item.product_unit?.unit_name}) × {item.quantity}</span></span><span className="font-semibold text-gray-600">{fmt(parseFloat(item.subtotal))}</span></div>))}<div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-2"><span className="font-medium text-gray-600">Transaction Total</span><span className="font-bold text-gray-800">{fmt(Math.abs(parseFloat(transaction.total_amount)))}</span></div></div></td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.lastPage > 1 && (
            <div className="px-3 sm:px-5 py-3 border-t bg-gray-50 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500">Page {pagination.currentPage} of {pagination.lastPage} (Showing first 50)</span>
              <div className="flex gap-2">
                <button disabled={pagination.currentPage <= 1} className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs">← Prev</button>
                <button disabled={pagination.currentPage >= pagination.lastPage} className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs">Next →</button>
              </div>
            </div>
          )}
          <div className="px-3 sm:px-5 py-3 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-8 text-xs sm:text-sm">
              <div><span className="text-gray-500">Total Sales: </span><span className="font-bold text-gray-800">{fmt(summary?.totalSales || 0)}</span></div>
              <div><span className="text-gray-500">Payments Received: </span><span className="font-bold text-teal-600">{fmt(summary?.paymentTotal || 0)}</span></div>
              <div><span className="text-gray-500">Transactions: </span><span className="font-bold text-gray-800">{summary?.totalTransactions || 0}</span></div>
            </div>
          </div>
        </div>
      )}

      {salesData?.data?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-600">No Transactions Found</h3>
          <p className="text-gray-400 text-sm">No sales or payment transactions for the selected period.</p>
        </div>
      )}
      {!salesData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-600">Generate Sales Report</h3>
          <p className="text-gray-400 text-sm">Select a date or date range and click "Generate Report"</p>
        </div>
      )}
    </div>
  );
};

export default ReportsInterface;