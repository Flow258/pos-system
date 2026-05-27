// components/CustomerHistoryModal.jsx
import React, { useState, useRef } from 'react';
import { X, ShoppingCart, CheckCircle, Trash2, PlusCircle, RefreshCw, Layers, Calendar, Printer } from 'lucide-react';

const API_BASE = 'api';
const STORE_NAME = 'Alquizalas Store';
const STORE_ADDRESS = 'Toledo, Bato, Cebu';
const STORE_TEL = '0917-XXX-XXXX';

const CustomerHistoryModal = ({
  selectedCustomerDetails,
  setShowCustomerHistory,
  setSelectedCustomerDetails,
  customerSales,
  setCustomerSales,
  activeSession,
  setActiveSession,
  viewCustomerHistory,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [startingFresh, setStartingFresh] = useState(false);
  const printRef = useRef();

  const balance = parseFloat(selectedCustomerDetails?.credit_balance || 0);

  const fmt = (n) =>
    '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const now = new Date().toLocaleString('en-PH');
    const customerName = selectedCustomerDetails?.name || 'Customer';
    const sessionNum = activeSession?.session_number || '—';
    const totalCredit = parseFloat(activeSession?.total_credit || 0);
    const totalPaid = parseFloat(activeSession?.total_paid || 0);

    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(`
      <html>
        <head>
          <title>Utang History - ${customerName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 72mm;
              padding: 3mm;
              color: #000;
            }
            @media print {
              @page { size: 72mm auto; margin: 0; }
              body { padding: 3mm; }
            }
            .center { text-align: center; }
            .right  { text-align: right; }
            .left   { text-align: left; }
            .bold   { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 1px 0; }
            .items-table td { padding: 2px 0; }
          </style>
        </head>
        <body>
          <!-- Store Header -->
          <div class="center">
            <div style="font-weight: bold; font-size: 16px; letter-spacing: 0.5px;">${STORE_NAME}</div>
            <div style="font-size: 11px;">${STORE_ADDRESS}</div>
            <div style="font-size: 11px;">${STORE_TEL}</div>
          </div>

          <hr />

          <!-- Title -->
          <div class="center bold" style="font-size: 13px; margin: 4px 0;">
            UTANG HISTORY — Session #${sessionNum}
          </div>

          <hr />

          <!-- Customer Info -->
          <div style="font-size: 11px; margin: 4px 0;">
            <div><strong>${customerName}</strong></div>
            <div>${selectedCustomerDetails?.phone_number || ''}</div>
            <div>${selectedCustomerDetails?.address || ''}</div>
            <div>Printed: ${now}</div>
          </div>

          <hr />

          <!-- Transactions -->
          ${content}

          <hr />

          <!-- Summary -->
          <table>
            <tr>
              <td>Total Credit Purchases</td>
              <td class="right">${fmt(totalCredit)}</td>
            </tr>
            <tr>
              <td>Total Payments</td>
              <td class="right">${fmt(totalPaid)}</td>
            </tr>
            <tr>
              <td colspan="2"><hr style="margin: 2px 0;" /></td>
            </tr>
            <tr>
              <td class="bold">Remaining Balance</td>
              <td class="right bold" style="font-size: 14px;">
                ${fmt(balance)}
              </td>
            </tr>
          </table>

          <hr />

          <!-- Footer -->
          <div class="center" style="font-size: 11px; margin-top: 6px;">
            <div>Thank you for your patronage!</div>
            <div style="margin-top: 4px; font-size: 10px; color: #666;">
              — Alquizalas Store —
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 350);
  };

  const handleDeleteSale = async (saleId) => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/sales/${saleId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setCustomerSales(prev => prev.filter(s => s.id !== saleId));
        await refreshCustomerBalance();
      } else {
        alert(data.message || 'Error deleting sale');
      }
    } catch (error) {
      alert('Error deleting sale');
    }
    setDeleting(false);
    setDeleteConfirmId(null);
  };

  const handleStartNewSeason = async () => {
    if (!selectedCustomerDetails) return;
    setStartingFresh(true);
    try {
      const response = await fetch(`${API_BASE}/credit-sessions/${selectedCustomerDetails.id}/start-fresh`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        alert(`✅ New season started!\n\nSession #${data.data.new_session.session_number} is now active.\nPrevious history has been archived.`);
        const custRes = await fetch(`${API_BASE}/customers/${selectedCustomerDetails.id}`);
        const custData = await custRes.json();
        if (custData.success) {
          setSelectedCustomerDetails(prev => ({
            ...prev,
            credit_balance: custData.data.credit_balance,
          }));
        }
        viewCustomerHistory(selectedCustomerDetails);
      } else {
        alert(data.message || 'Error starting new season');
      }
    } catch (error) {
      alert('Error starting new season');
    }
    setStartingFresh(false);
  };

  const refreshCustomerBalance = async () => {
    if (!selectedCustomerDetails) return;
    try {
      const custRes = await fetch(`${API_BASE}/customers/${selectedCustomerDetails.id}`);
      const custData = await custRes.json();
      if (custData.success) {
        setSelectedCustomerDetails(prev => ({
          ...prev,
          credit_balance: custData.data.credit_balance,
        }));
      }
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ── Header Section ── */}
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
                setActiveSession(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Balance display */}
          <div className={`mt-4 p-4 rounded-lg ${balance <= 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Current Utang Balance:</span>
              <span className={`text-2xl font-bold ${balance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                ₱{balance.toFixed(2)}
              </span>
            </div>
            {balance <= 0 && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Fully paid — utang cleared!
              </p>
            )}
          </div>

          {/* Session info banner */}
          {activeSession && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Layers className="w-4 h-4" />
                <span className="font-medium">Session #{activeSession.session_number}</span>
                <span className="text-blue-500">—</span>
                <span>Credit: ₱{parseFloat(activeSession.total_credit).toFixed(2)}</span>
                <span className="text-blue-500">|</span>
                <span>Paid: ₱{parseFloat(activeSession.total_paid).toFixed(2)}</span>
              </div>
              <button
                onClick={handleStartNewSeason}
                disabled={startingFresh}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                title="Archive current session and start fresh"
              >
                {startingFresh ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                {startingFresh ? 'Starting...' : 'New Season'}
              </button>
            </div>
          )}
        </div>

        {/* ── History List ── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Current Season History
              {activeSession && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Session #{activeSession.session_number}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {customerSales.length > 0 && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                  title="Print history as receipt"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              )}
              {customerSales.length > 0 && (
                <span className="text-xs text-gray-400">
                  {customerSales.length} transaction{customerSales.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Hidden print template — this content gets injected into the print window */}
          <div ref={printRef} style={{ display: 'none' }}>
            {customerSales.map((transaction) => (
              <div key={transaction.id} style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '11px', color: '#555' }}>
                  {new Date(transaction.sale_date).toLocaleString('en-PH')}
                </div>
                <table className="items-table">
                  <tbody>
                    <tr>
                      <td className="bold" style={{ fontSize: '12px' }}>
                        {transaction.payment_method === 'payment' ? 'PAYMENT' : 'PURCHASE'}
                      </td>
                      <td className="right bold" style={{ fontSize: '12px' }}>
                      {transaction.payment_method === 'payment' ? '-' : ''}{fmt(Math.abs(parseFloat(transaction.total_amount)))}
                    </td>
                  </tr>
                  </tbody>
                </table>
                {transaction.sale_items?.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#555', marginLeft: '4px' }}>
                    {transaction.sale_items.map((item, idx) => (
                      <div key={idx}>
                        • {item.product_unit?.product?.name || 'Product'} ({item.product_unit?.unit_name}) x{item.quantity} = {fmt(parseFloat(item.subtotal))}
                      </div>
                    ))}
                  </div>
                )}
                {transaction.payment_method === 'payment' && (
                  <div style={{ fontSize: '10px', color: '#166534' }}>
                    Payment applied to utang
                  </div>
                )}
              </div>
            ))}
          </div>

          {customerSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {balance <= 0 ? (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p className="font-medium text-green-600">All utang has been paid!</p>
                  <p className="text-sm mt-1">This season is settled. Start a new season for fresh credit history.</p>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No transactions in the current season</p>
                  <p className="text-sm mt-1">
                    {!activeSession ? 'No credit session started yet.' : 'New credit purchases will appear here.'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {customerSales.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4 relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.sale_date).toLocaleString()}
                      </p>
                      <p className="font-semibold text-lg">
                        {transaction.payment_method === 'payment' ? 'Payment' : 'Purchase'}:{' '}
                        ₱{Math.abs(parseFloat(transaction.total_amount)).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.payment_method === 'cash'    ? 'bg-green-100 text-green-700' :
                        transaction.payment_method === 'gcash'   ? 'bg-blue-100 text-blue-700' :
                        transaction.payment_method === 'credit'  ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-green-100 text-green-700'
                      }`}>
                        {transaction.payment_method === 'payment' ? 'PAYMENT' : transaction.payment_method.toUpperCase()}
                      </span>

                      <button
                        onClick={() => setDeleteConfirmId(transaction.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete this transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {transaction.sale_items?.length > 0 && (
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

                  {/* Single-item confirmation overlay */}
                  {deleteConfirmId === transaction.id && (
                    <div className="absolute inset-0 bg-white/95 rounded-lg flex items-center justify-center z-10">
                      <div className="text-center p-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="font-semibold text-gray-800 mb-1">Delete this transaction?</p>
                        <p className="text-sm text-gray-500 mb-3">
                          Stock will be restored and credit balance adjusted.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleDeleteSale(transaction.id)}
                            disabled={deleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            {deleting ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={() => {
              setShowCustomerHistory(false);
              setSelectedCustomerDetails(null);
              setCustomerSales([]);
              setActiveSession(null);
            }}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryModal;