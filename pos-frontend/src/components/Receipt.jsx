// components/Receipt.jsx
import { useRef } from "react";

const STORE_NAME  = "Alquizalas Store";
const STORE_ADDRESS = "Toledo, Bato, Cebu";
const STORE_TEL   = "0917-XXX-XXXX";

export default function Receipt({ receipt, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=420,height=700");
    win.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.receipt_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 58mm;
              padding: 3mm;
              color: #000;
            }
            @media print {
              @page { size: 58mm auto; }
              body { padding: 3mm; }
            }
            .center { text-align: center; }
            .right  { text-align: right; }
            .bold   { font-weight: bold; }
            hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 1px 0; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 350);
  };

  const fmt = (n) =>
    "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  const now = receipt.created_at
    ? new Date(receipt.created_at).toLocaleString("en-PH")
    : new Date().toLocaleString("en-PH");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-800">🧾 Receipt Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Thermal preview */}
        <div className="overflow-y-auto px-4 py-3 flex-1 bg-gray-50">
          <div
            ref={printRef}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "12px",
              maxWidth: "300px",
              margin: "0 auto",
              backgroundColor: "#fff",
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
            }}
          >
            {/* Store header */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <div style={{ fontWeight: "bold", fontSize: "16px", letterSpacing: "0.5px" }}>
                {STORE_NAME}
              </div>
              <div style={{ fontSize: "11px" }}>{STORE_ADDRESS}</div>
              <div style={{ fontSize: "11px" }}>{STORE_TEL}</div>
            </div>

            <hr />

            {/* Receipt meta */}
            <div style={{ fontSize: "11px", margin: "5px 0" }}>
              <div>Receipt #: <strong>{receipt.receipt_number}</strong></div>
              <div>Date: {now}</div>
              <div>
                Payment:{" "}
                <strong>
                  {receipt.payment_method === "credit"
                    ? "CREDIT (UTANG)"
                    : receipt.payment_method.toUpperCase()}
                </strong>
              </div>
              {receipt.customer_name && (
                <div>Customer: <strong>{receipt.customer_name}</strong></div>
              )}
              <div>Cashier: Admin</div>
            </div>

            <hr />

            {/* Items */}
            <table>
              <thead>
                <tr>
                  <td style={{ fontSize: "11px" }}><strong>Item</strong></td>
                  <td style={{ textAlign: "center", width: "30px", fontSize: "11px" }}><strong>Qty</strong></td>
                  <td style={{ textAlign: "right", width: "72px", fontSize: "11px" }}><strong>Amt</strong></td>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontSize: "12px" }}>{item.name}</div>
                      <div style={{ fontSize: "10px", color: "#555" }}>
                        {fmt(item.price)} × {item.qty}
                        {item.unit_name ? ` (${item.unit_name})` : ""}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>{item.qty}</td>
                    <td style={{ textAlign: "right" }}>
                      {fmt(item.qty * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr />

            {/* Totals */}
            <table>
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td style={{ textAlign: "right" }}>{fmt(receipt.subtotal ?? receipt.total)}</td>
                </tr>
                {receipt.discount > 0 && (
                  <tr>
                    <td>Discount</td>
                    <td style={{ textAlign: "right" }}>-{fmt(receipt.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td><strong>TOTAL</strong></td>
                  <td style={{ textAlign: "right" }}><strong>{fmt(receipt.total)}</strong></td>
                </tr>
                {receipt.payment_method === "cash" && (
                  <>
                    <tr>
                      <td>Cash Tendered</td>
                      <td style={{ textAlign: "right" }}>{fmt(receipt.cash_tendered ?? 0)}</td>
                    </tr>
                    <tr>
                      <td>Change</td>
                      <td style={{ textAlign: "right" }}>{fmt(receipt.change ?? 0)}</td>
                    </tr>
                  </>
                )}
                {receipt.payment_method === "credit" && (
                  <tr>
                    <td style={{ color: "#c2410c" }}>Added to Utang</td>
                    <td style={{ textAlign: "right", color: "#c2410c" }}>{fmt(receipt.total)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr />

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: "11px", marginTop: "6px" }}>
              <div>Thank you for shopping!</div>
              <div>Please come again 😊</div>
              <div style={{ marginTop: "4px", fontSize: "10px", color: "#666" }}>
                — Alquizalas Store —
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4 border-t bg-white">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}