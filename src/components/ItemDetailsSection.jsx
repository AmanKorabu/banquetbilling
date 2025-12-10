import React from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { AiFillEdit } from "react-icons/ai";
import dayjs from "dayjs";
import {
  MdOutlineProductionQuantityLimits,
  MdOutlineNoteAlt,
} from "react-icons/md";
import { GrTag } from "react-icons/gr";
import { FaRupeeSign, FaEdit } from "react-icons/fa";
import { BiSolidCartAdd } from "react-icons/bi";
import { MdUpdate } from "react-icons/md";
import { FcCancel } from "react-icons/fc";

function ItemDetailsSection({
  currentItem,
  setCurrentItem,
  bookingData,
  editingIndex,
  onItemPageClick,
  onAddItem,
  onDeleteItem,
  onEditItem,
  onModifyMenus,
  onRowDiscountChange,
  onKeyDown,
  onDateChange,
}) {
  const items = bookingData?.itemDetails || [];

  return (
    <div className="item-details-container">
      <h2>Item Details</h2>

      {/* ITEM INPUT SECTION */}
      <div className="item-contents">
        {/* Date Picker */}
        <div className="datetime">
          <h3>Date:</h3>
          <DatePicker
            label="Item Date"
            value={currentItem.itemDate || dayjs()}
            onChange={(v) => onDateChange("itemDate", v)}
            format="DD-MM-YYYY"
          />
        </div>

        {/* Select Item */}
        <h3>Select Item</h3>
        <div className="items" onClick={onItemPageClick}>
          <span>{currentItem.itemName || "No item selected"}</span>
          <AiFillEdit size={22} color="#847239be" />
        </div>

        {/* Quantity / Rate / Amount */}
        <div className="itemsSection">
          <div className="quantity">
            <div className="itms">
              <MdOutlineProductionQuantityLimits size={25} color="#847239be" />
              <h3>Quantity</h3>
            </div>
            <input
              type="number"
              name="quantity"
              value={currentItem.quantity || ""}
              onChange={(e) =>
                setCurrentItem((prev) => ({
                  ...prev,
                  quantity: e.target.value,
                }))
              }
              onKeyDown={onKeyDown}
            />
          </div>

          <div className="rate">
            <div className="itms">
              <GrTag size={20} color="#847239be" />
              <h3>Rate</h3>
            </div>
            <input
              type="number"
              name="rate"
              value={currentItem.rate || ""}
              onChange={(e) =>
                setCurrentItem((prev) => ({
                  ...prev,
                  rate: e.target.value,
                }))
              }
              onKeyDown={onKeyDown}
            />
          </div>

          <div className="amount">
            <div className="itms">
              <FaRupeeSign size={20} color="#847239be" />
              <h3>Amount</h3>
            </div>
            <input
              type="number"
              readOnly
              value={
                (Number(currentItem.quantity) || 0) *
                (Number(currentItem.rate) || 0)
              }
            />
          </div>
        </div>

        {/* Note */}
        <div className="ItemNote">
          <div className="itms">
            <MdOutlineNoteAlt size={25} color="#847239be" />
            <h3>Note</h3>
          </div>
          <textarea
            name="description"
            value={currentItem.description || ""}
            onChange={(e) =>
              setCurrentItem((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            onKeyDown={onKeyDown}
          />
        </div>

        {/* Add / Update Button */}
        <div className="addItem">
          <button
            type="button"
            className="addb"
            onClick={onAddItem}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: editingIndex !== null ? "#f6b452" : "#3067f2",
              color: "#fff",
              border: "none",
              padding: "10px 15px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {editingIndex !== null ? (
              <>
                <MdUpdate size={25} color="#fff" />
                UPDATE ITEM
              </>
            ) : (
              <>
                <BiSolidCartAdd size={25} color="#fff" />
                ADD ITEM
              </>
            )}
          </button>
        </div>
      </div>

      {/* ITEM TABLE */}
      {items.length > 0 && (
        <div className="tableItem">
          <table>
            <thead>
              <tr>
                <th>X</th>
                <th>Edit</th>
                <th>Sr No</th>
                <th>Date</th>
                <th>Item</th>
                <th>Menus</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Discount</th>
                <th>Taxable</th>
                <th>Tax Name</th>
                <th>Tax %</th>
                <th>Tax Amt</th>
                <th>Total</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rate) || 0;
                const amount = qty * rate;
                const discount = Number(item.discount || 0);
                const taxable = Math.max(0, amount - discount);
                const taxName = item.taxName || "-";
                const taxPercent = Number(item.taxPercent || 0);
                const taxAmt = (taxable * taxPercent) / 100;
                const total = taxable + taxAmt;

                return (
                  <tr key={idx}>
                    {/* Delete */}
                    <td>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(idx)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <FcCancel size={20} />
                      </button>
                    </td>

                    {/* Edit */}
                    <td>
                      <button
                        type="button"
                        onClick={() => onEditItem(idx)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <FaEdit size={20} color="#847239be" />
                      </button>
                    </td>



                    <td>{idx + 1}</td>
                    <td>
                      {item.itemDate
                        ? dayjs(item.itemDate).format("DD-MM-YYYY")
                        : ""}
                    </td>
                    <td>{item.itemName}</td>

                    {/* Menus List */}
                    <td>
                      {item.selectedMenus &&
                        Object.keys(item.selectedMenus).length > 0 ? (
                        <ul className="menu-list">
                          {Object.values(item.selectedMenus).map((menu, i) => (
                            <li key={i}>
                              {typeof menu === "object" ? menu.name : menu}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "-"
                      )}
                      {/* Modify Menus */}
                     
                        {item.cats && item.cats.length > 0 ? (
                          <button
                            className="modify-menus-btn"
                            onClick={() => onModifyMenus(idx)}
                          >
                            🍽 Modify Menus
                          </button>
                        ) : (
                          "-"
                        )}
                     
                    </td>

                    <td>{qty}</td>
                    <td>{rate}</td>
                    <td>{amount}</td>

                    <td>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) =>
                          onRowDiscountChange(idx, e.target.value)
                        }
                        onKeyDown={onKeyDown}
                        style={{ width: "100%", padding: "5px" }}
                      />
                    </td>

                    <td>{taxable}</td>
                    <td>{taxName}</td>
                    <td>{taxPercent}</td>
                    <td>{taxAmt.toFixed(2)}</td>
                    <td>{total.toFixed(2)}</td>
                    <td>{item.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th,
        td {
          border: 1px solid #ddd;
          text-align: left;
          padding: 6px;
        }
        th {
          background: #f9fafb;
          font-weight: bold;
        }
        .menu-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .menu-list li {
          font-size: 12px;
          color: #374151;
        }
        .modify-menus-btn {
          font-size: 12px;
          background-color: #f59e0b;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          table {
            font-size: 12px;
          }
          .modify-menus-btn {
            font-size: 10px;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  );
}

export default ItemDetailsSection;
