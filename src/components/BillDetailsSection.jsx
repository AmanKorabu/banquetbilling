// components/BillDetailsSection.js
import React from "react";

function BillDetailsSection({
  subTotal,
  totalDiscount,
  taxableAmount,
  taxAmount,
  otherCharges,
  setOtherCharges,
  settlementDiscount,
  setSettlementDiscount,
  roundOff,
  billAmount,
  onKeyDown,
}) {
  return (
    <div className="bill-details-container">
      <h2>Bill Details</h2>
      <table className="bill-table">
        <tbody>
          <tr>
            <td><b>Sub Total</b></td>
            <td>{subTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Discount</td>
            <td>{totalDiscount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Taxable Amount</td>
            <td>{taxableAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax Amount</td>
            <td>{taxAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Other Charges</td>
            <td>
              <input
                type="number"
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </td>
          </tr>
          <tr>
            <td>Settlement Discount</td>
            <td>
              <input
                type="number"
                value={settlementDiscount}
                onChange={(e) => setSettlementDiscount(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </td>
          </tr>
          <tr>
            <td>Round off</td>
            <td>{roundOff.toFixed(2)}</td>
          </tr>
          <tr>
            <td><b>Bill Amount</b></td>
            <td><b>{billAmount.toFixed(2)}</b></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default BillDetailsSection;