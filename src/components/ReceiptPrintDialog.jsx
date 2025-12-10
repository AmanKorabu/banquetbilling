import React from "react";
import { FaPrint } from "react-icons/fa";

/* ----------------------- Styles for Dialog (on screen) ------------------------ */
const RECEIPT_PRINT_STYLES = `
.receipt-print-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.receipt-print-dialog {
  background: #fff;
  max-width: 900px;
  width: 95%;
  max-height: 95vh;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

.receipt-print-header {
  padding: 10px 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
}

.receipt-print-header h3 {
  margin: 0;
  font-size: 18px;
}

.receipt-dialog-close {
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
}

.receipt-print-loading {
  padding: 30px 16px;
  text-align: center;
  font-size: 14px;
  color: #555;
}

.receipt-print-content-wrapper {
  padding: 10px;
  overflow: auto;
  flex: 1;
}

/* Paper box like QuotationPreview */
.receipt-print-paper {
  max-width: 210mm;
  margin: 0 auto;
  padding: 16px;
  background: white;
  border: 1px solid #000;
}

/* Header & title similar style */
.receipt-print-company {
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.receipt-print-company h1 {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}
.receipt-print-company p {
  margin: 2px 0 0 0;
  font-size: 13px;
}
.receipt-print-title {
  textAlign: center;
  margin: 10px 0 12px 0;
}
.receipt-print-title h2 {
  margin: 0;
  font-size: 18px;
  text-decoration: underline;
}

/* Meta & party details */
.receipt-print-meta,
.receipt-print-party {
  font-size: 12px;
  margin-bottom: 8px;
}
.receipt-print-meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.receipt-print-party > div {
  margin-bottom: 2px;
}

/* Table */
.receipt-print-body table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 6px;
}
.receipt-print-body td {
  padding: 4px 4px;
  border-bottom: 1px solid #e3e3e3;
}
.receipt-print-body tr:last-child td {
  border-bottom: 1px solid #000;
}
.receipt-print-body td.amount {
  text-align: right;
}
.receipt-print-body tr.total-row td {
  font-weight: bold;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
}

/* Amount in words */
.receipt-print-words {
  font-size: 12px;
  margin-top: 8px;
  padding: 5px;
  background: #f8f9fa;
}

/* Footer (mode, note) */
.receipt-print-footer {
  font-size: 12px;
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px dashed #aaa;
}
.receipt-print-footer > div {
  margin-bottom: 3px;
}

/* Actions */
.receipt-print-actions {
  padding: 10px 16px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: #f8f9fa;
}

.reset-button,
.invoice-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.reset-button {
  background: #6c757d;
  color: #fff;
}
.invoice-button {
  background: #28a745;
  color: #fff;
}
.invoice-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile tweaks */
@media (max-width: 768px) {
  .receipt-print-dialog {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  .receipt-print-paper {
    padding: 10px;
    border-width: 1px;
  }
  .receipt-print-company h1 {
    font-size: 18px;
  }
  .receipt-print-title h2 {
    font-size: 16px;
  }
}
`;

/* ----------------------- Styles used INSIDE the print popup ------------------------ */
const POPUP_PRINT_STYLES = `
body {
  margin: 0;
  padding: 10mm;
  font-family: Arial, sans-serif;
  -webkit-print-color-adjust: exact;
}

.receipt-print-paper {
  max-width: 210mm;
  margin: 0 auto;
  padding: 16px;
  background: white;
  border: 1px solid #000;
}

/* Header & title */
.receipt-print-company {
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.receipt-print-company h1 {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}
.receipt-print-company p {
  margin: 2px 0 0 0;
  font-size: 13px;
}
.receipt-print-title {
  text-align: center;
  margin: 10px 0 12px 0;
}
.receipt-print-title h2 {
  margin: 0;
  font-size: 18px;
  text-decoration: underline;
}

/* Meta & party details */
.receipt-print-meta,
.receipt-print-party {
  font-size: 12px;
  margin-bottom: 8px;
}
.receipt-print-meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.receipt-print-party > div {
  margin-bottom: 2px;
}

/* Table */
.receipt-print-body table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 6px;
}
.receipt-print-body td {
  padding: 4px 4px;
  border-bottom: 1px solid #e3e3e3;
}
.receipt-print-body tr:last-child td {
  border-bottom: 1px solid #000;
}
.receipt-print-body td.amount {
  text-align: right;
}
.receipt-print-body tr.total-row td {
  font-weight: bold;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
}

/* Amount in words */
.receipt-print-words {
  font-size: 12px;
  margin-top: 8px;
  padding: 5px;
  background: #f8f9fa;
}

/* Footer (mode, note) */
.receipt-print-footer {
  font-size: 12px;
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px dashed #aaa;
}
.receipt-print-footer > div {
  margin-bottom: 3px;
}

@page {
  size: A4;
  margin: 10mm;
}
`;

/* ----------------------- Receipt Print Dialog ------------------------ */
function ReceiptPrintDialog({ open, loading, data, onClose, sourceType = "quotation" }) {

  if (!open) return null;

  const formatAmount = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0.00";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const convertNumberToWords = (num) => {
    if (!num || isNaN(num)) return "ZERO";

    const number = parseFloat(num);
    if (number === 0) return "ZERO";

    const ones = [
      "",
      "ONE",
      "TWO",
      "THREE",
      "FOUR",
      "FIVE",
      "SIX",
      "SEVEN",
      "EIGHT",
      "NINE",
      "TEN",
      "ELEVEN",
      "TWELVE",
      "THIRTEEN",
      "FOURTEEN",
      "FIFTEEN",
      "SIXTEEN",
      "SEVENTEEN",
      "EIGHTEEN",
      "NINETEEN",
    ];
    const tens = [
      "",
      "",
      "TWENTY",
      "THIRTY",
      "FORTY",
      "FIFTY",
      "SIXTY",
      "SEVENTY",
      "EIGHTY",
      "NINETY",
    ];

    const convertBelowHundred = (n) => {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    };

    const convertBelowThousand = (n) => {
      if (n < 100) return convertBelowHundred(n);
      return (
        ones[Math.floor(n / 100)] +
        " HUNDRED" +
        (n % 100 !== 0 ? " AND " + convertBelowHundred(n % 100) : "")
      );
    };

    let n = Math.floor(number);
    let result = "";

    if (n >= 10000000) {
      const crores = Math.floor(n / 10000000);
      result += convertBelowThousand(crores) + " CRORE ";
      n %= 10000000;
    }
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000);
      result += convertBelowThousand(lakhs) + " LAKH ";
      n %= 100000;
    }
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      result += convertBelowThousand(thousands) + " THOUSAND ";
      n %= 1000;
    }
    if (n > 0) {
      if (result !== "") result += "AND ";
      result += convertBelowThousand(n);
    }

    return result.trim() + " ONLY";
  };

  const amountInWords =
    data && (data.Received || data.BillAmount)
      ? convertNumberToWords(data.Received || data.BillAmount)
      : "ZERO";
  // 👇 Decide what to show based on sourceType
  const labelForRefNo = sourceType === "invoice" ? "Invoice No" : "Quotation No";

  // Adjust these field names according to your API response
  const valueForRefNo =
    sourceType === "invoice"
      ? (data?.InvoiceNo || data?.BillNo || "")   // <- use actual field names from your API
      : (data?.QuotationNo || "");

  const headerTitle =
    sourceType === "invoice"
      ? `Receipt (Invoice #${valueForRefNo || "N/A"})`
      : `Receipt (Quotation #${valueForRefNo || "N/A"})`;


  const handlePrint = () => {
    if (!data) return;
    const labelForRefNo = sourceType === "invoice" ? "Invoice No" : "Quotation No";
    const valueForRefNo =
      sourceType === "invoice"
        ? (data.InvoiceNo || data.BillNo || "")
        : (data.QuotationNo || "");

    const headerTitle =
      sourceType === "invoice"
        ? `Receipt (Invoice #${valueForRefNo || "N/A"})`
        : `Receipt (Quotation #${valueForRefNo || "N/A"})`;

    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    const html = `
<html>
<head>
  <title>${headerTitle}</title>
  <style>${POPUP_PRINT_STYLES}</style>
</head>
<body>
  <div class="receipt-print-paper">
    <div class="receipt-print-company">
      <h1>XPRESS BANQUET</h1>
      <p>Kolhapur Maharashtra</p>
    </div>

    <div class="receipt-print-title">
      <h2>RECEIPT</h2>
    </div>

      <div class="receipt-print-meta">
      <div><strong>Date:</strong> ${data.Date || ""}</div>
      <div>
        <strong>${labelForRefNo}:</strong> ${valueForRefNo || "N/A"}<br />
        <strong>Voucher No:</strong> ${data.VoucherNo || "N/A"}
      </div>
    </div>


    <div class="receipt-print-party">
      <div><strong>Party:</strong> ${data.PartyName || ""}</div>
      ${data.Address && data.Address.trim()
        ? `<div><strong>Address:</strong> ${data.Address}</div>`
        : ""
      }
      ${data.MobileNo
        ? `<div><strong>Mobile:</strong> ${data.MobileNo}</div>`
        : ""
      }
    </div>

    <div class="receipt-print-body">
      <table>
        <tbody>
          <tr>
            <td>Package Charges</td>
            <td class="amount">₹${formatAmount(data.PackageCharges)}</td>
          </tr>
          ${Number(data.VenueCharges) > 0
        ? `
          <tr>
            <td>Venue Charges</td>
            <td class="amount">₹${formatAmount(data.VenueCharges)}</td>
          </tr>`
        : ""
      }
          ${Number(data.OtherCharges) > 0
        ? `
          <tr>
            <td>Other Charges</td>
            <td class="amount">₹${formatAmount(data.OtherCharges)}</td>
          </tr>`
        : ""
      }
          <tr>
            <td>Sub Total</td>
            <td class="amount">₹${formatAmount(data.SubTotal)}</td>
          </tr>
          ${Number(data.Discount) > 0
        ? `
          <tr>
            <td>Discount</td>
            <td class="amount">-₹${formatAmount(data.Discount)}</td>
          </tr>`
        : ""
      }
          ${Number(data.Taxable) > 0
        ? `
          <tr>
            <td>Taxable</td>
            <td class="amount">₹${formatAmount(data.Taxable)}</td>
          </tr>`
        : ""
      }
          ${Number(data.Tax) > 0
        ? `
          <tr>
            <td>Tax</td>
            <td class="amount">₹${formatAmount(data.Tax)}</td>
          </tr>`
        : ""
      }
          ${Number(data.ExtraCharges) > 0
        ? `
          <tr>
            <td>Extra Charges</td>
            <td class="amount">₹${formatAmount(data.ExtraCharges)}</td>
          </tr>`
        : ""
      }
          ${Number(data.RoundOff) !== 0
        ? `
          <tr>
            <td>Round Off</td>
            <td class="amount">₹${formatAmount(data.RoundOff)}</td>
          </tr>`
        : ""
      }
          <tr>
            <td>Received</td>
            <td class="amount">₹${formatAmount(data.Received)}</td>
          </tr>
          <tr class="total-row">
            <td>Bill Amount</td>
            <td class="amount">₹${formatAmount(data.BillAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="receipt-print-words">
      <strong>Rupees (Received):</strong> ${amountInWords}
    </div>

    <div class="receipt-print-footer">
      <div>
        <strong>Mode:</strong> ${data.Paymode || ""} ${data.Account ? `(${data.Account})` : ""
      }
      </div>
      ${data.Note && data.Note.trim()
        ? `<div><strong>Note:</strong> ${data.Note}</div>`
        : ""
      }
    </div>
  </div>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="receipt-print-backdrop" onClick={onClose}>
      <div
        className="receipt-print-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="receipt-print-header">
          <div>
            <h3>{headerTitle}</h3>
            {data?.VoucherNo && (
              <div style={{ fontSize: 12, color: "#666" }}>
                Voucher No: {data.VoucherNo}
              </div>
            )}
          </div>
          <button
            type="button"
            className="receipt-dialog-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>


        {/* Content */}
        <div className="receipt-print-content-wrapper">
          {loading && (
            <div className="receipt-print-loading">Loading receipt...</div>
          )}

          {!loading && !data && (
            <div className="receipt-print-loading">
              No receipt details available.
            </div>
          )}

          {!loading && data && (
            <div className="receipt-print-paper">
              <div className="receipt-print-company">
                <h1>XPRESS BANQUET</h1>
                <p>Kolhapur Maharashtra</p>
              </div>

              <div className="receipt-print-title">
                <h2>RECEIPT</h2>
              </div>

              <div className="receipt-print-meta">
                <div>
                  <strong>Date:</strong> {data.Date}
                </div>
                <div>
                  <strong>{labelForRefNo}:</strong> {valueForRefNo || "N/A"}
                  <br />
                  <strong>Voucher No:</strong> {data.VoucherNo || "N/A"}
                </div>
              </div>


              <div className="receipt-print-party">
                <div>
                  <strong>Party:</strong> {data.PartyName}
                </div>
                {data.Address && data.Address.trim() && (
                  <div>
                    <strong>Address:</strong> {data.Address}
                  </div>
                )}
                {data.MobileNo && (
                  <div>
                    <strong>Mobile:</strong> {data.MobileNo}
                  </div>
                )}
              </div>

              <div className="receipt-print-body">
                <table>
                  <tbody>
                    <tr>
                      <td>Package Charges</td>
                      <td className="amount">
                        ₹{formatAmount(data.PackageCharges)}
                      </td>
                    </tr>

                    {Number(data.VenueCharges) > 0 && (
                      <tr>
                        <td>Venue Charges</td>
                        <td className="amount">
                          ₹{formatAmount(data.VenueCharges)}
                        </td>
                      </tr>
                    )}

                    {Number(data.OtherCharges) > 0 && (
                      <tr>
                        <td>Other Charges</td>
                        <td className="amount">
                          ₹{formatAmount(data.OtherCharges)}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td>Sub Total</td>
                      <td className="amount">
                        ₹{formatAmount(data.SubTotal)}
                      </td>
                    </tr>

                    {Number(data.Discount) > 0 && (
                      <tr>
                        <td>Discount</td>
                        <td className="amount">
                          -₹{formatAmount(data.Discount)}
                        </td>
                      </tr>
                    )}

                    {Number(data.Taxable) > 0 && (
                      <tr>
                        <td>Taxable</td>
                        <td className="amount">
                          ₹{formatAmount(data.Taxable)}
                        </td>
                      </tr>
                    )}

                    {Number(data.Tax) > 0 && (
                      <tr>
                        <td>Tax</td>
                        <td className="amount">
                          ₹{formatAmount(data.Tax)}
                        </td>
                      </tr>
                    )}

                    {Number(data.ExtraCharges) > 0 && (
                      <tr>
                        <td>Extra Charges</td>
                        <td className="amount">
                          ₹{formatAmount(data.ExtraCharges)}
                        </td>
                      </tr>
                    )}

                    {Number(data.RoundOff) !== 0 && (
                      <tr>
                        <td>Round Off</td>
                        <td className="amount">
                          ₹{formatAmount(data.RoundOff)}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td>Received</td>
                      <td className="amount">
                        ₹{formatAmount(data.Received)}
                      </td>
                    </tr>

                    <tr className="total-row">
                      <td>Bill Amount</td>
                      <td className="amount">
                        ₹{formatAmount(data.BillAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="receipt-print-words">
                <strong>Rupees (Received):</strong> {amountInWords}
              </div>

              <div className="receipt-print-footer">
                <div>
                  <strong>Mode:</strong> {data.Paymode}{" "}
                  {data.Account ? `(${data.Account})` : ""}
                </div>
                {data.Note && data.Note.trim() && (
                  <div>
                    <strong>Note:</strong> {data.Note}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="receipt-print-actions">
          <button
            type="button"
            className="reset-button"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="invoice-button"
            onClick={handlePrint}
            disabled={loading || !data}
          >
            <FaPrint style={{ marginRight: 6 }} size={16} />
            Print
          </button>
        </div>

        {/* Inline styles for dialog */}
        <style>{RECEIPT_PRINT_STYLES}</style>
      </div>
    </div>
  );
}

export default ReceiptPrintDialog;
